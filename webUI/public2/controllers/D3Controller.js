hashtagApp.controller('D3Controller',['$scope', 'ioFactory', function( $scope, ioFactory){
    
    $scope.glob = [{"count":44,"tag":"#방탄소년단"},{"count":19,"tag":"#DolceAmoreItsAllComingBack"},{"count":18,"tag":"#BTS"},{"count":13,"tag":"#TeenChoice"},{"count":13,"tag":"#FIRE2ndWin"},{"count":12,"tag":"#モンスト"},{"count":12,"tag":"#ランキングバトル"},{"count":12,"tag":"#ALDUBinITALYDay5"},{"count":7,"tag":"#JIMIN"},{"count":6,"tag":"#정국"}];
    $scope.th = [{"count":9,"tag":"#방탄소년단"},{"count":7,"tag":"#BTS"},{"count":4,"tag":"#FIRE2ndWin"},{"count":3,"tag":"#MarkBam"},{"count":2,"tag":"#EXO"},{"count":1,"tag":"#เหนือแอน…"},{"count":1,"tag":"#อาร์มี่ยินดีด้วยนะ"},{"count":1,"tag":"#kookmin"},{"count":1,"tag":"#JIMIN"},{"count":1,"tag":"#ฝรั่งคือนิพพาน"}];
    
    $scope.sumOfTop = {glob:100, th:20};

    var sumFunc = function(arr){
      return arr.map(function(d){return d.count;})
                .reduce(function(pre,curr){return pre + curr;});
    };

    ioFactory.io().then(function(io){

        var socket=io('http://ec2-54-201-43-90.us-west-2.compute.amazonaws.com:3000');
        socket.on('server', function (data) {
            socket.emit('browser', {});
        });

        socket.on('topTags', function(msg) {
          $scope.$apply(function(){
            $scope.glob = msg;
            $scope.sumOfTop.glob = sumFunc($scope.glob);
          });
        });

        socket.on('topTagByLangs', function(msg) {
          msg.forEach(function(d){
            if(d.lang=="th") {
              $scope.$apply(function(){
                $scope.th = d.topTags;
                $scope.sumOfTop.th = sumFunc($scope.th);
              });
            }
          });
        });

    });
}]);