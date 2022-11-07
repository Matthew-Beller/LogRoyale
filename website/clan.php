<?php
    error_reporting(0);
    $id = '';
    if(isset($_GET["id"])){
        $id = $_GET["id"];
    }

    $searchinput = str_replace(" ", "+", $id);
    $searchinput = str_replace("#", "", $id);

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

    $opts = [
        "http" => [
            "header" => "Authorization: Bearer ".$token
        ]
    ];

    $context = stream_context_create($opts);
    // pulls data from RoyaleAPI to display clan info not store in SQL
    try{
        $apijson = @file_get_contents("https://api.clashroyale.com/v1/clans/%23$id",true, $context);
        if ($apijson === FALSE){
            throw new Exception("Cannot access tag search to read contents.");
        }
        $apiData= json_decode($apijson, true);

    } catch (Exception $e){
    }
    // pulls and stores data from SQL database necessary to create heatmap of login times and to display in graph
    $sql = $conn->prepare("SELECT activityTimes.player_id, activityTimes.activity_time, surveyList.player_name, surveyList.in_clan FROM activityTimes INNER JOIN surveyList ON surveyList.player_id=activityTimes.player_id WHERE activityTimes.clan_id = ? AND surveyList.in_clan = 1 ORDER BY player_id");
    $sql->bind_param("s", $id);
    $sql->execute();
    $sql->store_result();
    $sql->bind_result($playerid, $activityTime, $playerName, $inClan);
    $sql->fetch();

    $data = array();
    $counter = 0;
    while($sql->fetch()){
        $data[] = array("player_id"=>$playerid, "activity_time"=>$activityTime, "player_name"=>$playerName, "in_clan"=>$inClan);
    }

    $sql->close();

    $sql = $conn->prepare("SELECT clanTracking.clan_id, clanTracking.tracking FROM clanTracking WHERE clan_id = ?");
    $sql->bind_param("s", $id);
    $sql->execute();
    $sql->store_result();
    $sql->bind_result($clanid, $tracking);
    $sql->fetch();

    $trackingData = array("clanID"=>$clanid, "tracking"=>$tracking);

    $conn->close();


    if(isset($_POST['trackingButton'])) {
        addClanToClanTrackingList($id, $conn);
    }

    // updates the SQL database to include this clan in the clanTracking table
    // default tracking value set to false, clan description needs to be checked for key phrase before tracking begins
    function addClanToClanTrackingList($id, $conn) {
        $sql = $conn->prepare("SELECT clanTracking.clan_id, clanTracking.tracking FROM clanTracking WHERE clan_id = ?");
        $sql->bind_param("s", $id);
        $sql->execute();
        $sql->store_result();

        if($sql->num_rows == 0) {
            $sql = $conn->prepare("INSERT INTO clanTracking(clan_id, tracking) VALUES(?, False)");
            $sql->bind_param("s", $id);
            $sql->execute();
            $sql->store_result();
            header("refresh: 0;");
        } else if($sql->num_rows == 1){
            foreach ($sql as $row){
                $trackingData[] = $row;
            }
        } else {

        }
        $conn->close();
    }
?>

<!DOCTYPE html>
<html>
    <head>
        <title>LogRoyale</title>
        <link rel="shortcut icon" type="image/jpg" href="../img/log-royale-favicon-black.ico"/>
        <link rel="stylesheet" type="text/css" href="../css/style-clan.css"/>
        <script src="https://kit.fontawesome.com/360f6fd684.js" crossorigin="anonymous"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet"> 
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.5.1/chart.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-U1DAWAznBHeqEIlVSCgzq+c9gqGAJn5c/t99JyeKa9xxaYpSvHU5awsuZVVFIhvj" crossorigin="anonymous"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
        <script type="text/javascript" src="../javascript/clanpage.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    </head>
    <body onload='intializeClanPage(<?php echo json_encode($data);?>, <?php echo json_encode($trackingData);?>, <?php echo json_encode($apiData);?>);'>
        <div class="top-menu">
            <a id="logo-link" href="index.php" alt="Log Royale" alt = 'Log Royale' title='Log Royale Logo'>
                    <img class="logos" id="log-royale-logo" src="../img/log-royale-long-logo.png">
                    <img class="logos" id="log-royale-logo-black" src="../img/log-royale-long-logo-black.png">
            </a>
            <form class="search-bar" id="search-bar" action="search.php" method="GET" autocomplete="off">
                    <input value="<?php echo $id;?>" name = "q" id="search-bar-input" type="text" placeholder="Tag or Name #A1BC23" onfocus="highlightSearchBar()" onblur="unhighlightSearchBar()">
                    <button class="form-submit-button" type="submit"><i class="fas fa-search" id="search-icon"></i></button>
            </form>
        </div>
        <div id="tracking-banner-wrapper"></div>
        <div class="results-box" id="results-box">
            <div class="clan-info" id="clan-info-box">
                <div class="clan-info" id="clan-name"><?php echo $apiData['name'];?></div>
                <div class="clan-info" id="clan-tag"><?php echo $apiData['tag'];?></div>
                <div class="clan-info" id="clan-type"><?php echo ucwords($apiData['type']);?></div>
                <div class="clan-info" id="clan-description"><?php echo $apiData['description'];?></div>
                <div id="clan-info-sub-box">
                    <div class="clan-info-wrapper" id="clan-trophies-wrapper">
                        <div class="clan-info clan-info-headers">Trophies</div>
                        <div class="clan-info clan-info-sub-text" id="clan-total-trophies"><?php echo $apiData['clanScore'];?></div>
                    </div>

                    <div class="clan-info-wrapper" id="clan-war-trophies-wrapper">
                        <div class="clan-info clan-info-headers">Clan War Trophies</div>
                        <div class="clan-info clan-info-sub-text" id="clan-war-trophies"><?php echo $apiData['clanWarTrophies'];?></div>
                    </div>
                    <div class="clan-info-wrapper" id="clan-required-trophies-wrapper">
                        <div class="clan-info clan-info-headers">Required Trophies</div>
                        <div class="clan-info clan-info-sub-text" id="clan-required-trophies"><?php echo $apiData['requiredTrophies'];?></div>
                    </div>
                    <div class="clan-info-wrapper" id="clan-location-wrapper">
                        <div class="clan-info clan-info-headers">Location</div>
                        <div class="clan-info clan-info-sub-text" id="clan-location"><?php echo $apiData['location']['name'];?></div>
                    </div>
                    <div class="clan-info-wrapper" id="clan-donations-wrapper">
                        <div class="clan-info clan-info-headers">Weekly Donations</div>
                        <div class="clan-info clan-info-sub-text" id="clan-donations"><?php echo $apiData['donationsPerWeek'];?></div>
                    </div>
                    <div class="clan-info-wrapper" id="clan-members-wrapper">
                        <div class="clan-info clan-info-headers">Members</div>
                        <div class="clan-info clan-info-sub-text" id="clan-member-count"><?php echo $apiData['members'];?>/50</div>
                    </div>
                </div>
            </div>
            <div id="activity-heat-map-wrapper">
                <div id="activity-heat-map"></div>
            </div>
            <div class="date-selection-boxes">
                <input class="form-control" id="date-input" type="datetime" placeholder="Select Date" onchange='dateChangeUpdate(<?php echo json_encode($data);?>)'>
                <select class="dropdown" id="time-frame-dropdown" onchange='refreshDataDisplays();'>
                    <option value="year">Year</option>
                    <option value="week">Week</option>
                    <option value="day">Day</option>
                </select>
                <script>
                    flatpickr("#date-input", {
                        defaultDate: "today",
                        altInput: true,
                        altFormat: "F j, Y",
                        dateFormat: "Y-m-d",
                    });
                </script>
            </div>
            <div id="clan-canvas-wrapper">
                <canvas id="clan-activity-chart"></canvas>
            </div>
            <div id="player1-dropdown-wrapper">
                <select class="dropdown" id="player-dropdown1" onchange='createPlayerGraph(<?php echo json_encode($data);?>);'></select>
            <div id="player2-dropdown-wrapper">
                <select class="dropdown" id="player-dropdown2" onchange='createPlayerGraph(<?php echo json_encode($data);?>);'></select>
            </div>
            <div id="player-activity-chart-wrapper">
                <div id="player-activity-chart"></dov>
            </div>
        </div>
    </body>
    <footer class="footer">
            <div id="footer-text">This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it. For more information see <a id = "supercell-fan-policy-link" href="https://supercell.com/en/fan-content-policy/">Supercell's Fan Content Policy</a>.</div>
    </footer>
</html>