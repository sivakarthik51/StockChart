var StockChart = angular.module('StockMarket',['ngMaterial', 'ngMessages']);

StockChart.factory('ChartData',function($http){
  var getChartData = function(sym){
    return $http.get('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol='+sym+'&apikey=NJ3FWMKQQMKME7IR').then(function(response){
      return response.data;
    });
  }
  return {getChartData:getChartData};
});

StockChart.controller('chartController',function($scope, $http,ChartData,$mdToast) {
  $scope.symbol = null;
  $scope.activeSymbols = [];
  $scope.errorMessage = null;
  $scope.isLoading = false;
  $scope.series= [];
  if(window.location.hostname === 'localhost'){
  //$scope.socket = io('http://localhost:8080/');
  $scope.socket = io.connect('http://localhost:8080');
  }
  else{
    $scope.socket = io.connect('https://charting-stock.herokuapp.com:8080');
  }
  $scope.drawChart = function(){
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
  $scope.deleteSymbol = function(chip){
    $scope.series.splice($scope.series.findIndex(item => item.name === chip), 1)
    $scope.socket.emit('deleteElement',{symbol:chip});
    $scope.drawChart();
  }
  $scope.socket.on('connect',function(){
        console.log('Connected');
        $scope.socket.on('Stock',function(data){
          console.log(data);
          //$scope.socket.emit('AddSymbol',{symbol:$scope.symbol});
        });
        $scope.socket.on('activeSymbols',function(data){
          $scope.isLoading = true;
          if(data.active!={}){
          data.active.map(function(element){
            $scope.symbol = element.name;
            ChartData.getChartData($scope.symbol).then(function(response) {
              $scope.getChartData(response["Meta Data"]["2. Symbol"],response);
              
            });
            
          });
          }
          $scope.isLoading = false;
        });
        $scope.socket.on('RecieveSymbol',function(data){
          if(!data.hasOwnProperty('error')){
            $scope.symbol = data.symbol;
            ChartData.getChartData($scope.symbol).then(function(response) {
              console.log(response);
              $scope.getChartData(response["Meta Data"]["2. Symbol"],response);
              
            });
          }
          else{
            $scope.errorMessage = data.error;
          }
          $scope.showSimpleToast("Added Symbol");
        });
        $scope.socket.on('renderDelete',function(data){
          $scope.series.splice($scope.series.findIndex(item => item.name === data.data), 1);
          $scope.activeSymbols.splice($scope.activeSymbols.findIndex(item => item === data.data),1);
          $scope.drawChart();
        });
      });
  $scope.handleAddStock = function(){
    $scope.socket.emit('AddSymbol',{symbol:$scope.symbol});
  }
  $scope.showSimpleToast = function(text) {

    $mdToast.show(
      $mdToast.simple()
        .textContent(text)
        .position('top right')
        .hideDelay(3000)
    );
  };
  $scope.getChartData = function(symbol,response){
      
      $scope.errorMessage=null;
      if($scope.activeSymbols.indexOf(symbol)===-1){
      
      
        if(!response.hasOwnProperty("Error Message")){
          $scope.activeSymbols.push(symbol);
          var dat = [];
          Object.keys(response["Time Series (Daily)"]).forEach(function(key){
            var value = response["Time Series (Daily)"][key];
            dat.push([new Date(key).getTime(),parseFloat(value["4. close"])]);
          });
          dat = _.sortBy(dat,function(e){return e[0]});
          $scope.series.push({
            name:symbol,
            data:dat,
            tooltip: {
                  valueDecimals: 2
              }
            });
           $scope.drawChart();
        }
        else{
          $scope.errorMessage=response['Error Message'];
        }
    }
    else{
      $scope.errorMessage = 'Symbol already present';
    }
  }
  
 
  
});
