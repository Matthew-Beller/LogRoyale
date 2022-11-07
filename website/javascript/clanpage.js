
//Initialization Funcitons
function intializeClanPage(clanData, trackingData = null, apiData) {
    createTrackingBanner(trackingData);
    sessionStorage.setItem('apiData', JSON.stringify(apiData));
    sessionStorage.setItem('processedClanData', JSON.stringify(processClanData(clanData, getDateFromBox())));
    sessionStorage.setItem('rawClanData', JSON.stringify(clanData));
    sessionStorage.setItem('currentHeatYear', 0);
    populatePlayerDropdown("player-dropdown1");
    populatePlayerDropdown("player-dropdown2");
    refreshDataDisplays();
}

function dateChangeUpdate(clanData){
    sessionStorage.setItem('processedClanData', JSON.stringify(processClanData(clanData, getDateFromBox())));
    refreshDataDisplays();
}

function refreshDataDisplays(){
    createClanGraph();
    createPlayerGraph();
    createHeatMap();
}

function processClanData(clanData, dateInput){
    var unique = [...new Set(clanData.map(item => item.player_id))];
    var processedClanData = {totals: {dayOfWeekCount: [0,0,0,0,0,0,0], monthCount: [0,0,0,0,0,0,0,0,0,0,0,0], hourCount: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}, playerData: []};
    let apiData = JSON.parse(sessionStorage.getItem('apiData'));
    for(member of unique){
        processedClanData.playerData.push({player_id: member, player_name: '', in_clan: 0, dayOfWeekCount: [0,0,0,0,0,0,0], monthCount: [0,0,0,0,0,0,0,0,0,0,0,0], hourCount: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]});
    }

    for(member of apiData.memberList){
        for(entry of processedClanData.playerData)
            if(member.tag.replace('#', '') == entry.player_id){
                entry.player_name = member.name;
            }
    }

    var index = 0;
    for(var entry of clanData){
        if(entry.player_id == processedClanData.playerData[index].player_id){
            if(entry.in_clan == 1){
                processedClanData.playerData[index].in_clan = 1;
            }
            var activity_time = new Date (entry.activity_time);
            var activity_time_time_zone_adjusted = convertDateToUTCWithoutSwitchingTimeZone(activity_time);

            if(dateInput.getFullYear() == activity_time_time_zone_adjusted.getFullYear()){
                processedClanData.playerData[index].monthCount[activity_time_time_zone_adjusted.getMonth()]++;
                processedClanData.totals.monthCount[activity_time_time_zone_adjusted.getMonth()]++;
            }

            if (isSameWeek(dateInput, activity_time_time_zone_adjusted)){
                processedClanData.playerData[index].dayOfWeekCount[activity_time_time_zone_adjusted.getDay()]++;
                processedClanData.totals.dayOfWeekCount[activity_time_time_zone_adjusted.getDay()]++;
            }

            if(dateInput.isSameDateAs(activity_time_time_zone_adjusted)){
                processedClanData.playerData[index].hourCount[activity_time_time_zone_adjusted.getHours()]++;
                processedClanData.totals.hourCount[activity_time_time_zone_adjusted.getHours()]++;
            }
        } else {
            index++;
        }
    }
        let playerData = processedClanData.playerData;
        const sorted = playerData.sort((a, b) => a.player_name.localeCompare(b.player_name));
        processedClanData.playerData = sorted;
    return processedClanData;
}
//Calendar Heat Maps Functions

function createHeatMap(){
    if(getDateFromBox().getFullYear() == sessionStorage.currentHeatYear){
        return;
    }

    var oldMap = document.getElementById('activity-heat-map');
    oldMap.remove();

    let location = document.getElementById("activity-heat-map-wrapper");
    let newMap = document.createElement('div');
    newMap.innerHTML = `<div id="activity-heat-map"></div>`;
    location.append(newMap);

    sessionStorage.setItem('currentHeatYear', getDateFromBox().getFullYear());
    let clanData = JSON.parse(sessionStorage.rawClanData);
    var activityData = {January: new Array(31).fill(0), February: new Array(31).fill(0), March: new Array(31).fill(0), April: new Array(31).fill(0), May: new Array(31).fill(0), June: new Array(31).fill(0), July: new Array(31).fill(0), August: new Array(31).fill(0), September: new Array(31).fill(0), October: new Array(31).fill(0), November: new Array(31).fill(0), December: new Array(31).fill(0)};
    var activityDataKeys = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    for(var entry of clanData){
        var activity_time = new Date (entry.activity_time);
        var activity_time_time_zone_adjusted = convertDateToUTCWithoutSwitchingTimeZone(activity_time);
        if(activity_time_time_zone_adjusted.getFullYear() == getDateFromBox().getFullYear())
            activityData[activityDataKeys[activity_time_time_zone_adjusted.getMonth()]][activity_time_time_zone_adjusted.getDate()-1]++;
    }
    var maxValue = 0;
    var month;
    for(month in activityData){
        monthArray = activityData[month];
        for(var dayCount of monthArray){
            if(dayCount > maxValue){
                maxValue = dayCount;
            }
        }
    }
    console.log(maxValue);
    let maxValueIncrements = Math.ceil(maxValue/100) * 100 / 5;

    var options = {
        series: [
            {
                name: 'Dec',
                data: activityData.December
            },
            {
                name: 'Nov',
                data: activityData.November
            },
            {
                name: 'Oct',
                data: activityData.October
            },
            {
                name: 'Sep',
                data: activityData.September
            },
            {
                name: 'Aug',
                data: activityData.August
            },
            {
                name: 'Jul',
                data: activityData.July
            },
            {
                name: 'Jun',
                data: activityData.June
            },
            {
                name: 'May',
                data: activityData.May
            },
            {
                name: 'Apr',
                data: activityData.April
            },
            {
                name: 'Mar',
                data: activityData.March
            },
            {
                name: 'Feb',
                data: activityData.February
            },
            {
                name: 'Jan',
                data: activityData.January
            }
      ],
        chart: {
        height: 300,
        type: 'heatmap',
        fontFamily: 'Roboto, sans-serif',
        foreColor: '#949597',
        toolbar: {
            show: false
        },
        zoom: {
            enabled: false
        }
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: .5,
          enableShades: false,
          radius: 0,
          useFillColorAsStroke: false,
          distributed: true,
          colorScale: {
            ranges: [
              {
                from: 0,
                to: 0,
                name: '0',
                color: '#fed976'
              },
              {
                from: 1,
                to: maxValueIncrements,
                color: '#feb24c'
              },
              {
                from: maxValueIncrements,
                to: maxValueIncrements * 2,
                color: '#fd8d3c'
              },
              {
                from: maxValueIncrements * 2,
                to: maxValueIncrements * 3,
                color: '#fc4e2a'
              },
              {
                from: maxValueIncrements * 3,
                to: maxValueIncrements * 4,
                color: '#e31a1c'
              },
              {
                from: maxValueIncrements * 4,
                to: maxValueIncrements * 5,
                color: '#bd0026'
              }
            ]
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        type: 'category'
      },
      stroke: {
        width: 1
      },
      title: {
        text: 'Total Clan Daily Logins for ' + getDateFromBox().getFullYear(),
        align: 'center'
      },
      };

      var chart = new ApexCharts(document.querySelector("#activity-heat-map"), options);
      chart.render();
}

//Clan Graph Functions
function createClanGraph() {
    //clan data needs to be processed to work
    var select = document.getElementById('time-frame-dropdown');
    var timeFrame = select.options[select.selectedIndex].value;

    var oldChart = document.getElementById('clan-activity-chart');
    oldChart.remove();

    let location = document.getElementById("clan-canvas-wrapper");
    let newCanvas = document.createElement('div');
    newCanvas.innerHTML = `<div id="clan-activity-chart"></div>`;
    location.append(newCanvas);

    if (timeFrame == 'year') {
        createClanYearGraph();
    } else if (timeFrame == 'week') {
        createClanWeekGraph();
    } else {
        createClanDayGraph();
    }
}

function createClanYearGraph() {
    let clanData = JSON.parse(sessionStorage.processedClanData);

    var options = {
        colors:['#ef3c2d'],
        series: [{
        name: 'Logins',
        data: clanData.totals.monthCount
      }],

        chart: {
        type: 'bar',
        height: 350,    
        fontFamily: 'Roboto, sans-serif',
        foreColor: '#949597',
        toolbar: {
            show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      },
      yaxis: {
        title: {
          text: 'Logins'
        }
      },
      fill: {
        opacity: 1
      },
      title: {
        text: 'Total Clan Monthly Logins for ' + getDateFromBox().getFullYear(),
        align: 'center'
      },
      };

      var chart = new ApexCharts(document.querySelector("#clan-activity-chart"), options);
      chart.render();
    
}

function createClanWeekGraph() {
            let clanData = JSON.parse(sessionStorage.processedClanData);
            const monthNames = ["January", "Februrary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            var options = {
                colors:['#ef3c2d'],
                series: [{
                name: 'Logins',
                data: clanData.totals.dayOfWeekCount
              }],
        
                chart: {
                type: 'bar',
                height: 350,    
                fontFamily: 'Roboto, sans-serif',
                foreColor: '#949597',
                toolbar: {
                    show: false
                },
              },
              plotOptions: {
                bar: {
                  horizontal: false,
                  columnWidth: '55%',
                  endingShape: 'rounded'
                },
              },
              dataLabels: {
                enabled: false
              },
              stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
              },
              xaxis: {
                categories: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              },
              yaxis: {
                title: {
                  text: 'Logins'
                }
              },
              fill: {
                opacity: 1
              },
              title: {
                text: 'Total Clan Daily Logins for the Week of ' + monthNames[getDateFromBox().getMonth()] + " " + getDateFromBox().getDate() + " " + getDateFromBox().getFullYear(),
                align: 'center'
              },
              };
        
              var chart = new ApexCharts(document.querySelector("#clan-activity-chart"), options);
              chart.render();
        
}

function createClanDayGraph() {
    let clanData = JSON.parse(sessionStorage.processedClanData);
    const monthNames = ["January", "Februrary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    var options = {
        colors:['#ef3c2d'],
        series: [{
        name: 'Logins',
        data: clanData.totals.hourCount
        }],

        chart: {
        type: 'bar',
        height: 350,    
        fontFamily: 'Roboto, sans-serif',
        foreColor: '#949597',
        toolbar: {
            show: false
        },
        },
        plotOptions: {
        bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
        },
        },
        dataLabels: {
        enabled: false
        },
        stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
        },
        xaxis: {
        categories: ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"],
        },
        yaxis: {
        title: {
            text: 'Logins'
        }
        },
        fill: {
        opacity: 1
        },
        title: {
        text: 'Total Clan Hourly Logins for ' + monthNames[getDateFromBox().getMonth()] + " " + getDateFromBox().getDate() + " " + getDateFromBox().getFullYear(),
        align: 'center'
        },
        };

        var chart = new ApexCharts(document.querySelector("#clan-activity-chart"), options);
        chart.render();

}

//Player Graph Functions
function createPlayerGraph() {
    var select = document.getElementById('time-frame-dropdown');
    var timeFrame = select.options[select.selectedIndex].value;

    var oldChart = document.getElementById('player-activity-chart');
    oldChart.remove();

    let location = document.getElementById("player-activity-chart-wrapper");
    let newCanvas = document.createElement('div');
    newCanvas.innerHTML = `<div id="player-activity-chart"></div>`;
    location.append(newCanvas);

    var player1_id = document.getElementById('player-dropdown1').value;
    var player2_id = document.getElementById('player-dropdown2').value;

    if((player1_id != "None") || (player2_id != "None")) {
        player1_id = player1_id.split('#')[1];
        player2_id = player2_id.split('#')[1];
        if (timeFrame == 'year') {
            createPlayerYearGraph(player1_id, player2_id);
        } else if (timeFrame == 'week') {
            createPlayerWeekGraph(player1_id, player2_id);
        } else {
            createPlayerDayGraph(player1_id, player2_id);
        }
    }
}

function createPlayerYearGraph(player1_id, player2_id = null) {
    let clanData = JSON.parse(sessionStorage.processedClanData);
    var player1MonthCount = [];
    var player2MonthCount = [];

    for(player of clanData.playerData){
        if(player.player_id == player1_id){
            player1MonthCount = player.monthCount;

        }
        if(player.player_id == player2_id){
            player2MonthCount = player.monthCount;
        }
    }

    var player1_label = document.getElementById('player-dropdown1').value;
    var player2_label = document.getElementById('player-dropdown2').value;

    var options = {
        legend: {
            position: 'top',
            onItemClick: {
              toggleDataSeries: false
          }
        },
        colors:['#ef3c2d', '#4091c9'],
        series: [{
        name: player1_label,
        data: player1MonthCount
      },{
      name: player2_label,
      data: player2MonthCount
        }
        ],
        chart: {
        type: 'bar',
        height: 350,    
        fontFamily: 'Roboto, sans-serif',
        foreColor: '#949597',
        toolbar: {
            show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      },
      yaxis: {
        title: {
          text: 'Logins'
        }
      },
      fill: {
        opacity: 1
      },
      title: {
        text: 'Player Monthly Logins for ' + getDateFromBox().getFullYear(),
        align: 'center'
      },
      };

      var chart = new ApexCharts(document.querySelector("#player-activity-chart"), options);
      chart.render();
}

function createPlayerWeekGraph(player1_id, player2_id = null) {
    let clanData = JSON.parse(sessionStorage.processedClanData);
    const monthNames = ["January", "Februrary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    var player1DayOfWeekCount = [];
    var player2DayOfWeekCount = [];

    for(player of clanData.playerData){
        if(player.player_id == player1_id){
            var player1DayOfWeekCount = player.dayOfWeekCount;

        }
        if(player.player_id == player2_id){
            var player2DayOfWeekCount = player.dayOfWeekCount;
        }
    }

    var player1_label = document.getElementById('player-dropdown1').value;
    var player2_label = document.getElementById('player-dropdown2').value;

    var options = {
        legend: {
            position: 'top',
            onItemClick: {
              toggleDataSeries: false
            }
        },
        colors:['#ef3c2d', '#4091c9'],
        series: [{
            name: player1_label,
            data: player1DayOfWeekCount
          },{
          name: player2_label,
          data: player2DayOfWeekCount
            }
            ],

        chart: {
        type: 'bar',
        height: 350,    
        fontFamily: 'Roboto, sans-serif',
        foreColor: '#949597',
        toolbar: {
            show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      },
      yaxis: {
        title: {
          text: 'Logins'
        }
      },
      fill: {
        opacity: 1
      },
      title: {
        text: 'Player Daily Logins for the Week of ' + monthNames[getDateFromBox().getMonth()] + " " + getDateFromBox().getDate() + " " + getDateFromBox().getFullYear(),
        align: 'center'
      },
      };

      var chart = new ApexCharts(document.querySelector("#player-activity-chart"), options);
      chart.render();
}

function createPlayerDayGraph(player1_id, player2_id = null) {
    let clanData = JSON.parse(sessionStorage.processedClanData);
    const monthNames = ["January", "Februrary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    var player1HourCount = [];
    var player2HourCount = [];


    for(player of clanData.playerData){
        if(player.player_id == player1_id){
            var player1HourCount = player.hourCount;

        }
        if(player.player_id == player2_id){
            var player2HourCount = player.hourCount;
        }
    }

    var player1_label = document.getElementById('player-dropdown1').value;
    var player2_label = document.getElementById('player-dropdown2').value;

    var options = {
        legend: {
            position: 'top',
            onItemClick: {
              toggleDataSeries: false
            }
        },
        colors:['#ef3c2d', '#4091c9'],
        series: [{
            name: player1_label,
            data: player1HourCount
          },{
          name: player2_label,
          data: player2HourCount
            }
            ],

        chart: {
        type: 'bar',
        height: 350,    
        fontFamily: 'Roboto, sans-serif',
        foreColor: '#949597',
        toolbar: {
            show: false
        }
        },
        plotOptions: {
        bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
        },
        },
        dataLabels: {
        enabled: false
        },
        stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
        },
        xaxis: {
        categories: ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"],
        },
        yaxis: {
        title: {
            text: 'Logins'
        }
        },
        fill: {
        opacity: 1
        },
        title: {
        text: 'Player Hourly Logins for ' + monthNames[getDateFromBox().getMonth()] + " " + getDateFromBox().getDate() + " " + getDateFromBox().getFullYear(),
        align: 'center'
        },
        };

        var chart = new ApexCharts(document.querySelector("#player-activity-chart"), options);
        chart.render();
}

//Player Dropdown functions
function populatePlayerDropdown(drop_down){
    let clanData = JSON.parse(sessionStorage.processedClanData);
    let location = document.getElementById(drop_down)
    let newCell = document.createElement('option');
    newCell.innerHTML = `
    <option value="None">None</option>`;
    location.append(newCell);
    for(player of clanData.playerData) {
        if(player.in_clan == 1) {
            addPlayerToDropdown(player.player_id, player.player_name, drop_down);
        }
    }
}

function addPlayerToDropdown(player_id, player_name, drop_down) {
    let location = document.getElementById(drop_down)
    let newCell = document.createElement('option');
    newCell.innerHTML = `
    <option value="${player_id}">${player_name} #${player_id}</option>`;
    location.append(newCell);
}

//Date Functions
Date.prototype.isSameDateAs = function(pDate) {
    return (
      this.getFullYear() === pDate.getFullYear() &&
      this.getMonth() === pDate.getMonth() &&
      this.getDate() === pDate.getDate()
    );
}

function convertDateToUTCWithoutSwitchingTimeZone(date) {
    let object = new Date (date);
    return new Date (Date.UTC(
        object.getFullYear(),
        object.getMonth(),
        object.getDate(),
        object.getHours(),
        object.getMinutes(),
        object.getSeconds()
        ));
}

function getDateFromBox() {
    var dateFromBox = document.getElementById("date-input").value;

    var dateFromBoxParts = dateFromBox.split('-');
    var dateInput = new Date(dateFromBoxParts[0], dateFromBoxParts[1] - 1, dateFromBoxParts[2]);
    return dateInput;
}

function isSameWeek(anchor_date, search_date) {
    var pathFindingDate = new Date (anchor_date);
    var weekStart;
    var weekEnd;

    while (pathFindingDate.getDay() != 0) {
        pathFindingDate.setDate(pathFindingDate.getDate() - 1);
    }
    weekStart = new Date(pathFindingDate);

    while (pathFindingDate.getDay() != 6) {
        pathFindingDate.setDate(pathFindingDate.getDate() + 1);
    }
    weekEnd = new Date(pathFindingDate);
    weekEnd.setHours(23);
    weekEnd.setMinutes(59);
    weekEnd.setSeconds(59);
    
    if ((search_date.getTime() <= weekEnd.getTime()) && (search_date.getTime() >= weekStart.getTime())) {
        return true;
    } else {
        return false;
    }
}

//Search Bar Functions
function highlightSearchBar() {
    document.getElementById("search-icon").style.color = "#323437";                    
}

function unhighlightSearchBar() {
    document.getElementById("search-icon").style.color = "#949597";
}

//Tracking Functions
function createTrackingBanner(trackingData) {
    if(trackingData.tracking == null) {
        let location = document.getElementById("tracking-banner-wrapper");
        let newElement = document.createElement('div');
        newElement.innerHTML = `
        <div id="tracking-banner">
            <div id="tracking-banner-message">This clan is not currently being tracked. To begin tracking, place "LogRoyale.com" anywhere in your clan description, then click "Begin Tracking"</div>
            <form method="post"?>
                <button id="begin-tracking-button" type="submit" name="trackingButton" value="trackingButton">Begin Tracking</button>
            </form>
        </div>`;
        location.append(newElement);
    } else if (trackingData.tracking == 0) {
        let location = document.getElementById("tracking-banner-wrapper");
        let newElement = document.createElement('div');
        newElement.innerHTML = `
        <div id="tracking-banner">
            <div id="tracking-banner-message">This clan is not currently being tracked. To begin tracking, place "LogRoyale.com" anywhere in your clan description. Tracking may take a few hours to begin</div>
        </div>`;
        location.append(newElement);
    } else {
    }
}