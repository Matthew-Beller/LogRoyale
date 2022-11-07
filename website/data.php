<?php
    $servername = "localhost";
    $username = "root";
    $password = "password";
    $dbname = "royaledatabase";

    $conn = new mysqli($servername, $username, $password, $dbname);
    $sql = "SELECT settings.apiKey FROM settings";
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()){
            $token = $row["apiKey"];
        }
    }
    $conn->close();

    $opts = [
        "http" => [
            "header" => "Authorization: Bearer ".$token
        ]
    ];

    $context = stream_context_create($opts);
    // preloads search data for faster runtimes
    try{
        $apijson = @file_get_contents("https://api.clashroyale.com/v1/clans/%23$searchinput",true, $context);
        if ($apijson === FALSE){
            throw new Exception("Cannot access tag search to read contents.");
        }
        $phparray = json_decode($apijson, true);

    } catch (Exception $e){
    }

    $conn = new mysqli($servername, $username, $password, $dbname);
    $sql = "SELECT player_id, activity_time, day_of_week FROM activityTimes WHERE clan_id = '$id' ORDER BY player_id";
    $result = $conn->query($sql);

    $data = array();
    foreach ($result as $row){
        $data[] = $row;
    }

    $result->close();
    $conn->close();
?>