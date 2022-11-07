CREATE TABLE activityTimes(
	player_id VARCHAR(10),
    clan_id VARCHAR(10),
    activity_time DATETIME,
    day_of_week INT,
    PRIMARY KEY(player_id, clan_id, activity_time)
);

CREATE TABLE surveyList(
	player_id VARCHAR(10),
    clan_id VARCHAR(10),
    last_seen DATETIME,
    PRIMARY KEY(player_id, clan_id)
);

CREATE TABLE clanTracking(
	clan_id VARCHAR(10),
    tracking BOOLEAN,
    PRIMARY KEY (clan_id)
);

CREATE TABLE settings(
	apiKey VARCHAR(1000),
    directory VARCHAR(1000),
    timeZone VARCHAR(10)
);

UPDATE settings SET apiKey = 'YOUR API KEY HERE';