    hashtagApp.controller('CodeController', ['$document','$scope',function ($document,$scope) {
      $scope.val = 0;
      $scope.section = [];
      $scope.section.push($document[0].getElementById("section1"));
      $scope.section.push($document[0].getElementById("section2"));
      $scope.section.push($document[0].getElementById("section3"));
      $scope.section.push($document[0].getElementById("section4"));
      $scope.section.push($document[0].getElementById("section5"));
      
      $scope.newValue = function(value) {
          for(var i=0; i !=$scope.section.length; ++i){
            var tmp;
            if(i==value) tmp="block";
            else tmp="none";
            $scope.section[i].style.display=tmp;
          }
      }

    }]);