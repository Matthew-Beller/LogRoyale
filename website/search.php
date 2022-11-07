<?php
    error_reporting(0);
    session_start();

    if(isset($_GET["q"])){
        $q = $_GET["q"];
    }

    $searchinput = str_replace(" ", "%20", $q);
    $searchinput = str_replace("#", "", $searchinput);

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
    
    // limits the number of results presented in search
    $limit = 50;
    $context = stream_context_create($opts);

    // retrieves search data from RoyaleAPI
    // pulls up name, clan tag, number of memebers, and location and places them into a 2D array
    // this list array is later used by a javascript to populate the search results box
    try{
        $clanArray = array();
        $apijson = @file_get_contents("https://api.clashroyale.com/v1/clans?name=$searchinput&limit=$limit",true, $context);
        if ($apijson === FALSE){
            throw new Exception("Cannot access tag search to read contents.");
        } else {
            $phparray = json_decode($apijson, true);
            foreach ($phparray['items'] as &$clan) {
                array_push($clanArray, array($clan['name'], $clan['tag'], $clan['members'], $clan['location']['name']));
            }   
        }
        if (empty($phparray['items'])) {
            $apijson = @file_get_contents("https://api.clashroyale.com/v1/clans/%23$searchinput",true, $context);
            $phparray = json_decode($apijson, true);
            array_push($clanArray, array($phparray['name'], $phparray['tag'], $phparray['members'], $phparray['location']['name']));
        }

    } catch (Exception $e){ // handles case where number of results is less than the limit value, potential bug in RoyaleAPI
        try {
            $apijson = @file_get_contents("https://api.clashroyale.com/v1/clans/%23$searchinput",true, $context);
            if ($apijson === FALSE){
                throw new Exception("Cannot access tag search to read contents.");
            }
            $phparray = json_decode($apijson, true);
            
            $clanArray = array();
            array_push($clanArray, array($phparray['name'], $phparray['tag'], $phparray['members'], $phparray['location']['name']));
            
   
        } catch (Exception $e) {
        }
    }
?>

<!DOCTYPE html>
<html>
    <head>
        <title>LogRoyale</title>
        <link rel="shortcut icon" type="image/jpg" href="../img/log-royale-favicon-black.ico"/>
        <link rel="stylesheet" type="text/css" href="../css/style-search.css"/>
        <script src="https://kit.fontawesome.com/360f6fd684.js" crossorigin="anonymous"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet"> 
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="text/javascript" src="../javascript/searchpage.js"></script>
    </head>
    <body onload='populateSearchResultBox(<?php echo json_encode($clanArray);?>);'>
        <div class="top-menu">
            <a id="logo-link" href="index.php" alt = 'Log Royale' title='Log Royale Logo'>
                <img class="logos" id="log-royale-logo" src="../img/log-royale-long-logo.png">
                <img class="logos" id="log-royale-logo-black" src="../img/log-royale-long-logo-black.png">
            </a>
            <form class="search-bar" id="search-bar" action="search.php" method="GET" autocomplete="off">
                    <input value="<?php echo $q;?>" name = "q" id="search-bar-input" type="text" placeholder="Tag or Name #A1BC23" onfocus="highlightSearchBar()" onblur="unhighlightSearchBar()">
                    <button class="form-submit-button" type="submit"><i class="fas fa-search" id="search-icon"></i></button>
            </form>
        </div>
        <div class="results-box" id="results-box"></div>
    </body>
    <footer class="footer">
            <div id="footer-text">This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it. For more information see <a id = "supercell-fan-policy-link" href="https://supercell.com/en/fan-content-policy/">Supercell's Fan Content Policy</a>.</div>
    </footer>
</html>