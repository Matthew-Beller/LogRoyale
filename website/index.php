<!DOCTYPE html>
<html>
    <head>
        <title>LogRoyale</title>
        <link rel="shortcut icon" type="image/jpg" href="../img/log-royale-favicon-black.ico"/>
        <link rel="stylesheet" type="text/css" href="../css/style-home.css"/>
        <script src="https://kit.fontawesome.com/360f6fd684.js" crossorigin="anonymous"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet"> 
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <div class="center">
            <img class="logos" id="log-royale-logo" src="../img/log-royale-long-logo.png" alt = 'Log Royale'title='Log Royale Logo'>
            <img class="logos" id="log-royale-logo-black" src="../img/log-royale-long-logo-black.png">
            <form class="search-bar" id="search-bar" action="search.php" method="GET" autocomplete="off">
                <input name = "q" id="search-bar-input" type="text" placeholder="Tag or Name #A1BC23" onfocus="highlightSearchBar()" onblur="unhighlightSearchBar()">
                <button class="form-submit-button" type="submit"><i class="fas fa-search" id="search-icon"></i></button>
            </form>
            <script type="text/javascript" src="../javascript/homepage.js"></script>
        </div>
    </body>
    <footer class="footer">
            <div id="footer-text">This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it. For more information see <a id = "supercell-fan-policy-link" href="https://supercell.com/en/fan-content-policy/">Supercell's Fan Content Policy</a>.</div>
    </footer>
</html>