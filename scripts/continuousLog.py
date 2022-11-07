from royaleAPIFunctions import *
import time
import queue
from mysql.connector.errors import IntegrityError
from datetime import datetime
import mysql.connector
from operator import itemgetter, attrgetter
from collections import deque

sleepTimer = 30
clanDataQueue = queue.Queue()

db = mysql.connector.connect(
    host = 'localhost',    
    user = 'root',   
    password = 'password',
    database = 'royaledatabase'
)

cursor = db.cursor()
cursor = db.cursor(buffered=True)

# Continually checks all of the clans that are currently being tracked for updates in player activity
while True:
    cursor.execute('SELECT DISTINCT clan_id, tracking FROM clanTracking;')
    clanList = cursor.fetchall()
    for clan in clanList:
        checkActivity(getClanData(clan[0]), clan[0])
    print("Sleeping")
    time.sleep(sleepTimer)