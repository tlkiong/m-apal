angular.module("mapal.services", ["firebase"])

.constant("firebaseUrl", "https://tutorial-bucket-list.firebaseio.com/")

.factory("Auth", ["$firebaseAuth", "$rootScope", "firebaseUrl",
    function ($firebaseAuth, $rootScope, firebaseUrl) {
    	$rootScope.firebaseUrl = firebaseUrl;
            var ref = new Firebase($rootScope.firebaseUrl);
            return $firebaseAuth(ref);
}])



.factory("Chats", function ($firebase, Rooms) {

}); 