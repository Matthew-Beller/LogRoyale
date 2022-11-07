import urllib.request
import json
from mysql.connector.errors import IntegrityError
import requests, os, bs4, time
from datetime import datetime
import mysql.connector
from operator import itemgetter, attrgetter

db = mysql.connector.connect(
    host = 'localhost',    
    user = 'root',   
    password = 'password',
    database = 'royaledatabase'
)

cursor = db.cursor()
cursor = db.cursor(buffered=True)

def getClanData(clanTag):
    """
    Fetches and returns a clan with a given tag's data from RoyaleAPI
    Tag must be entered without beginning # symbol
    Data is returned as JSON data
    """
    cursor.execute("SELECT settings.apiKey FROM settings")
    tempKey = cursor.fetchall()
    my_key = tempKey[0]
    base_url = "https://api.clashroyale.com/v1"

    endpoint = "/clans/%23" +clanTag
    while True:
        try:
            request = urllib.request.Request(base_url+endpoint,None,
        {
            "Authorization": "Bearer %s" % my_key
        }
        )
        except Exception:
            break
        break
    response = urllib.request.urlopen(request).read().decode('utf-8')
    return json.loads(response)

def addClanToSurveyList(clanTag):
    """
    Adds a clan and all of its members to the surveyList table the within SQL database
    Must be passed a clanTag without the # symbol at the beginning
    """
    data = getClanData(clanTag)
    for member in data["memberList"]:
        cleanPlayerTag = member['tag'].replace("#", "")
        cursor.execute("SELECT COUNT(1) FROM surveyList WHERE surveyList.player_id = '%s';" %(cleanPlayerTag))
        count = cursor.fetchall()
        if  count[0][0] == 0:
            cursor.execute("INSERT INTO surveyList VALUES('%s', '%s', NULL, NULL, True);" %(cleanPlayerTag, clanTag))
            db.commit()

def updateClanRosters():
    """
    Looks through every clan in the clanTracking SQL table within the SQL database
    Updates surveyList table to include new members of clans
    """
    cursor.execute("SELECT * FROM clanTracking")
    clanList = cursor.fetchall()
    for clan in clanList:
        if(clan[1] == True):
            data = getClanData(clan[0])
            for member in data["memberList"]:
                cleanPlayerTag = member['tag'].replace("#", "")
                cursor.execute("SELECT COUNT(1) FROM surveyList WHERE surveyList.player_id = '%s';" %(cleanPlayerTag))
                count = cursor.fetchall()
                if  count[0][0] == 0:
                    cursor.execute("INSERT INTO surveyList VALUES('%s', '%s', NULL, NULL, True);" %(cleanPlayerTag, clan[0]))
                    db.commit()

def checkActivity(clanData, clanID):
    """
    Passes raw clan data from RoyaleAPI and a clanID
    Checks to see which players have logged in since the last activity check and when
    Also updates player names if any players had undergone name changes
    Also checks if players are still in the given clan, if not their in_clan values in the surveyList table are updated
    """
    cursor.execute('SELECT surveyList.player_id, surveyList.clan_id, surveyList.last_seen, surveyList.player_name, surveyList.in_clan FROM surveyList WHERE clan_id = "%s"' %(clanID))
    playerList = cursor.fetchall()
    data = clanData
    # sorts memebr list by tag because this is needed to do binary search of member list later 
    sortedMemberList = sorted(data['memberList'], key=lambda member: member['tag'])

    if(checkStringInDescription(data, clanID, '')): # should be LogRoyale.com, keep empty until application is used by more clans
        cursor.execute("UPDATE clanTracking SET tracking = %s WHERE clan_id = '%s';" %('True', clanID))
    else:
        cursor.execute("UPDATE clanTracking SET tracking = %s WHERE clan_id = '%s';" %('False', clanID))
    db.commit()
    # for all players that are in the clan with the passedID 
    for player in playerList:
        searchIndex = searchMemberList(sortedMemberList, '#' + player[0])
        if searchIndex != -1:
            memberData = sortedMemberList[searchIndex]
            try:
                lastSeen = datetime.strptime(memberData['lastSeen'], '%Y%m%dT%H%M%S.%fZ')
            except KeyError:
                print("KeyError")
            # if the last time a player was seen differs from the last time seen recorded in RoyaleAPI
            # update the database last_seen time to match the lastSeen time from RoyaleAPI
            # log an activity time for the new last seen time
            if (player[2] is None) or (player[2] != lastSeen):
                cursor.execute("UPDATE surveyList SET last_seen = '%s' WHERE player_id = '%s' AND clan_id = '%s';" %(lastSeen.strftime('%Y-%m-%d %H:%M:%S'), player[0], player[1]))
                db.commit()
                try:
                    cursor.execute("INSERT INTO activityTimes(player_id, clan_id, activity_time) VALUES ('%s', '%s', '%s');" %(player[0], player[1], lastSeen.strftime('%Y-%m-%d %H:%M:%S')))
                    db.commit()
                except IntegrityError:
                    pass
            # if name field is blank or name in database doesn't match name in RoyaleAPI data, update name to match RoyaleAPI data
            if ((player[3] is None) or (player[3] != memberData['name'])):
                try:
                    cursor.execute("UPDATE surveyList SET player_name = '%s' WHERE player_id = '%s' AND clan_id = '%s';" %(memberData['name'].replace("'", "''"), player[0], player[1]))
                except IntegrityError:
                    pass
                db.commit()
        else:
            # updates in_clan value in surveryList to false if the player is not found
            try:
                cursor.execute("UPDATE surveyList SET in_clan = %s WHERE player_id = '%s' AND clan_id = '%s';" %('False', player[0], player[1]))
                db.commit()
            except IntegrityError:
                    pass



def inClan(data, player):
    """
    Passed raw clan data from RoyaleAPI and raw player data from RoyaleAPI
    Returns True if player is found in clan data, else False
    """
    for member in data['memberList']:
        if member['tag'] == "#" + player[0]:
            return True
    return False
    
def checkStringInDescription(data, clanID, searchString):
    """
    Passed raw clan data from RoyaleAPI and a search string
    Returns True if search string is found, else returns False
    """
    if(data['description'].lower().find(searchString.lower()) == -1):
        return False
    else:
        return True


def updateTrackingList():
    """
    Goes through every row of the clanTracking table from the SQL database
    Checks for the string "LogRoyale.com" within the clan's description
    If present, the clan will begin or continue to be tracked (tracking will be set to True)
    If absent, the clan will no longer be tracked (tracking will be set to False)
    """
    cursor.execute('SELECT clan_id FROM clanTracking;')
    clanList = cursor.fetchall()
    for clan in clanList:
        if(checkStringInDescription(getClanData(clan[0]), clan[0], '')): # should be LogRoyale.com, keep empty until application is used by more clans
            cursor.execute("UPDATE clanTracking SET tracking = %s WHERE clan_id = '%s';" %('True', clan[0]))
        else:
            cursor.execute("UPDATE clanTracking SET tracking = %s WHERE clan_id = '%s';" %('False', clan[0]))
        db.commit()

def addClanToTrackingList(clanID):
    """
    Adds a clanID to the clanTracking table within the SQL database
    Sets the tracking value to False
    """
    try:
        cursor.execute("INSERT INTO clanTracking(clan_id, tracking) VALUES('%s', %s);" %(clanID, 'False'))
        db.commit()
    except IntegrityError:
        pass

def searchMemberList(data, tag):
    """
    Passed raw clan data from RoyaleAPI and a clan tag WITH # at the beginning
    Finds and returns index of the player with the given tag
    If not found returns -1
    """
    low = 0
    mid = 0
    high = len(data)-1
    while low <= high:
        mid = (high + low) // 2

        if data[mid]['tag'] < tag:
            low = mid + 1

        elif data[mid]['tag'] > tag:
            high = mid - 1
 
        else:
            return mid
    return -1