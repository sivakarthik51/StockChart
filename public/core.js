var StockChart = angular.module('StockMarket',['ngMaterial', 'ngMessages']);

StockChart.controller('chartController',function($scope, $http) {
  $scope.symbol = 'AKAM';
  $scope.activeSymbols = [];
  $scope.errorMessage = null;
  $scope.isLoading = false;
  $scope.series= [];
  $scope.deleteSymbol = function(chip){
    $scope.series.splice($scope.series.findIndex(item => item.name === chip), 1)
    
    drawChart();
  }
  var socket= io();
  socket.on('connect',function(){
    socket.on('Stock',function(data){
      console.log(data);
    });
  });
  $scope.getChartData = function(){
    
    
      $scope.errorMessage=null;
      if($scope.activeSymbols.indexOf($scope.symbol)===-1){
      $scope.isLoading = true;
      $http.get('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol='+$scope.symbol+'&apikey=NJ3FWMKQQMKME7IR').then(function(response){
        if(!response['data'].hasOwnProperty("Error Message")){
          $scope.activeSymbols.push($scope.symbol);
          var dat = [];
          Object.keys(response["data"]["Time Series (Daily)"]).forEach(function(key){
            var value = response["data"]["Time Series (Daily)"][key];
            dat.push([new Date(key).getTime(),parseFloat(value["4. close"])]);
          });
          dat = _.sortBy(dat,function(e){return e[0]});
          $scope.series.push({
            name:$scope.symbol,
            data:dat,
            tooltip: {
                  valueDecimals: 2
              }
            });
           drawChart();
        }
        else{
          $scope.errorMessage=response['data']['Error Message'];
        }
        $scope.isLoading=false;
      });
    }
    else{
      $scope.errorMessage = 'Symbol already present';
    }
  }
  
  function drawChart(){
    Highcharts.stockChart('chart', {


        rangeSelector: {
            selected: 1
        },

        title: {
            text: 'Stock Chart'
        },

        series: $scope.series
    });
  
  }
  
});
