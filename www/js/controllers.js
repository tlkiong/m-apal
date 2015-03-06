angular.module('mapal.controllers', [])

.controller('LoginCtrl', function ($scope, $ionicModal, $state, $firebaseAuth, $ionicLoading, $rootScope) {

    //For dropdown list items
    $scope.roles = [
        {types:'student'},
        {types:'leader'},
        {types:'lecturer'}
    ];
    $scope.Role = $scope.roles[0]; // student

    var ref = new Firebase($scope.firebaseUrl);
    var auth = $firebaseAuth(ref);

    $ionicModal.fromTemplateUrl('templates/common/signup.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.createUser = function (user,Role) {
        console.log("Create User Function called");

        if (user && user.emailAddress && user.password && user.fullname && user.contactnumber && user.icnumber) {
            $ionicLoading.show({
                template: 'Signing Up...'
            });

            auth.$createUser({
                email: user.emailAddress,
                password: user.password
            }).then(function (userData) {
                alert("User created successfully!");

                ref.child("users").child(userData.uid).set({
                    email: user.emailAddress,
                    fullName: user.fullname,
                    contactNumber: user.contactnumber,
                    icNumber: user.icnumber,
                    role: Role.types
                });
                
                $ionicLoading.hide();
                $scope.modal.hide();
            }).catch(function (error) {
                alert("Error: " + error);
                $ionicLoading.hide();
            });
        } else
            alert("Please fill all details");
    }

    $scope.signIn = function (user) {
        if (user && user.emailAddress && user.pwdForLogin) {
            $ionicLoading.show({
                template: 'Signing In...'
            });
            auth.$authWithPassword({
                email: user.emailAddress,
                password: user.pwdForLogin
            }).then(function (authData) {
                
                // Get user data from Firebase
                ref.child("users").child(authData.uid).once('value', function (snapshot) {
                    var val = snapshot.val();
                    
                    // To Update AngularJS $scope either use $apply or $timeout
                    $scope.$apply(function () {
                        $rootScope.fullName = val.fullName;
                        $rootScope.emailAddress = user.emailAddress;
                        $rootScope.contactNumber = val.contactNumber;
                        $rootScope.icNumber = val.icNumber;
                        $rootScope.role = val.role;
                        $rootScope.classSchedule = val.classSchedule;
                        $rootScope.groupID = val.groupID;
                    });
                    $rootScope.userId = authData.uid;
                    $rootScope.signedIn = true;

                    console.log("Signed in Logged in as: " + String($rootScope.fullName));
                    console.log("Signed in ID: " + String($rootScope.userId));
                    console.log("Email Address: " + String($rootScope.emailAddress));
                    console.log("Contact Number: " + String($rootScope.contactNumber));
                    console.log("IC Number: " + String($rootScope.icNumber));
                    console.log("Role: " + String($rootScope.role));

                    if(String($rootScope.role) == 'student'){
                        console.log("role is student");
                        if($rootScope.classSchedule == null){
                            $ionicLoading.hide();
                            $state.go('addClassSchedule');
                        } else {
                            if($rootScope.groupID == null){
                                $state.go('student-ViewGroupList');
                            }else{

                                //Get group data from Firebase
                                ref.child("groups").child($rootScope.groupID).once('value', function (snapshot) {
                                    var val = snapshot.val();

                                    // To Update AngularJS $scope either use $apply or $timeout
                                    $scope.$apply(function () {
                                        $rootScope.groupName = val.Name;
                                        //TODO: Add all the group data here
                                    });

                                    if($rootScope.groupStatus == "pending"){
                                        $state.go('viewGroupMemberList');
                                    } else if ($rootScope.groupStatus == "active"){
                                        $state.go('student-tab.timeline');
                                    } else if ($rootScope.groupStatus == "disabled"){
                                        console.log("Group status disabled. Not supposed to have this. Something went wrong somewhere");
                                    } else if ($rootScope.groupStatus == null){
                                        console.log ("group status is null");
                                    } else {
                                        console.log ("group status is not pending or active");
                                    }
                                });
                            }
                        }
                    } else if ($rootScope.role == 'leader'){
                        $ionicLoading.hide();
                        console.log("role is leader");
                        if($rootScope.classSchedule == null){
                            $state.go('addClassSchedule');
                        } else {
                            if($rootScope.groupID == null){
                                $state.go('leader-CreateGroup');
                            }else{

                                //Get group data from Firebase
                                ref.child("groups").child($rootScope.groupID).once('value', function (snapshot) {
                                    var val = snapshot.val();

                                    // To Update AngularJS $scope either use $apply or $timeout
                                    $scope.$apply(function () {
                                        $rootScope.groupName = val.Name;
                                        //TODO: Add all the group data here
                                    });
                                    
                                    if($rootScope.groupStatus == "pending"){
                                        $state.go('viewGroupMemberList');
                                    } else if ($rootScope.groupStatus == "active"){
                                        $state.go('leader-tab.timeline');
                                    } else if ($rootScope.groupStatus == "disabled"){
                                        console.log("Group status disabled. Not supposed to have this. Something went wrong somewhere");
                                    } else {
                                        console.log ("group status is not pending or active");
                                    }
                                });
                            }
                        }
                    } else if ($rootScope.role == 'lecturer'){
                        $ionicLoading.hide();
                        console.log("role is lecturer");

                    } else {
                        $ionicLoading.hide();
                        console.log("Role is not student, leader or lecturer: "+String($rootScope.role));
                        alert("Authentication failed");
                    }
                });  
            }).catch(function (error) {
                alert("Authentication failed:" + error.message);
                $ionicLoading.hide();
            });
        } else {
            alert("Please enter email and password both");
        }
    }
})

.controller('ClassScheduleCtrl', function ($scope, $rootScope, $ionicModal, $ionicLoading, $state, $ionicPopup, $firebaseAuth) {
    if(!$rootScope.signedIn||$rootScope.signedIn===undefined){
        // An alert dialog
        var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'You are not logged in, please log in first'
        });
        alertPopup.then(function(res) {
            $state.go('login');
        });
    } else {
        console.log("We are at AddClassScheduleCtrl");
        console.log("email Address: "+String($rootScope.emailAddress));

        //For dropdown list day items
        $scope.days = [
            {named:'Sunday'},
            {named:'Monday'},
            {named:'Tuesday'},
            {named:'Wednesday'},
            {named:'Thursday'},
            {named:'Friday'},
            {named:'Saturday'}
        ];
        $scope.day = $scope.days[0]; // Sunday

        //newClassModal
        $ionicModal.fromTemplateUrl('templates/common/newClassModal.html', {
            scope: $scope
        }).then(function (newClassModal) {
            $scope.newClassModal = newClassModal;
        });

        //editClassModal
        $ionicModal.fromTemplateUrl('templates/common/editClassModal.html', {
            scope: $scope
        }).then(function (editClassModal) {
            $scope.editClassModal = editClassModal;
        });

        //itemOptionModal
        $ionicModal.fromTemplateUrl('templates/common/itemOptionModal.html', {
            scope: $scope
        }).then(function (itemOptionModal) {
            $scope.itemOptionModal = itemOptionModal;
        });
        

        var ref = new Firebase($scope.firebaseUrl);

        //Create new class
        $scope.createNewClass = function (userClass,day) {
            console.log("Create new class function called");

            if (userClass && userClass.classNamed && userClass.classVenue) {
                $ionicLoading.show({
                    template: 'Creating new class...'
                });

                var userClassID = "class"+String(day.named);
                console.log(userClassID)

                var userRef = ref.child("users").child($rootScope.userId);
                var userRef = ref.child("users").child($rootScope.userId).child("class");
                console.log("userRef: "+userRef);
                try{
                    userRef.push({
                        classDay: day.named,
                        classNamed: userClass.classNamed,
                        classVenue: userClass.classVenue,
                        classStartTime: userClass.startTime,
                        classEndTime: userClass.endTime
                    })
                }catch(error) {
                    console.log("HAHAHAHA Error!");
                };
                
                $ionicLoading.hide();
                $scope.newClassModal.hide();
                $scope.getClassTimetable($rootScope.userId);
                
            } else
                alert("Please fill all details");
        }

        $scope.getClassTimetable = function(userID){
            var classRef = ref.child("users").child(userID).child("class");

            //free time usage
            var dayArray=new Array(7)
            for (var i=0; i <7 ;i++){
                dayArray[i]=new Array(11);
            }
            var hourCounter = 8;
            for (var j = 0; j<7 ;j++){
                for (var k = 0; k<11; k++){
                    dayArray[j][k] = hourCounter;
                     hourCounter++;
                }
                hourCounter = 8;
            }
            //dayArray[day][hour]
            //day: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

            $scope.sundayList = [];
            $scope.mondayList = [];
            $scope.tuesdayList = [];
            $scope.wednesdayList = [];
            $scope.thursdayList = [];
            $scope.fridayList = [];
            $scope.saturdayList = [];

            classRef.orderByChild("classDay").on("child_added", function (snapshot) {
                var value = snapshot.val();
                var dayOfClass = value.classDay;
                value.key = String(snapshot.key());

                //will have different list for different days.
                switch(dayOfClass){
                    case "Friday":{
                        $scope.fridayList.push(value);
                    }
                    break;
                    case "Monday":{
                        $scope.mondayList.push(value);
                    }
                    break;
                    case "Saturday":{
                        $scope.saturdayList.push(value);
                    }
                    break;
                    case "Sunday":{
                        $scope.sundayList.push(value);
                    }
                    break;
                    case "Tuesday":{
                        $scope.tuesdayList.push(value);
                    }
                    break;
                    case "Thursday":{
                        $scope.thursdayList.push(value);
                    }
                    break;
                    case "Wednesday":{
                        $scope.wednesdayList.push(value);
                    }
                    break;
                    default: console.log("ERROR!! dayOfClass: "+dayOfClass);
                    break;
                }
            });
        }

        $scope.getClassTimetable($rootScope.userId);

        $scope.goViewGroupList = function(){
            $state.go('student-viewGroupList');
        }

        $scope.goTimeline = function(){
            $state.go('student-tab.timeline');
        }

        $scope.editClassSchedule = function(classItem){
            $scope.itemOptionModal.show();
            $scope.classItem = classItem;
            console.log("classitem.classStartTime: "+$scope.classItem.classStartTime);
            console.log("classitem.classEndTime: "+$scope.classItem.classEndTime);
        }

        $scope.edit = function(){
            $scope.itemOptionModal.hide();
            $scope.editClassModal.show();
            switch($scope.classItem.classDay){
                case "Sunday": $scope.day = $scope.days[0];
                break;
                case "Monday": $scope.day = $scope.days[1];
                break;
                case "Tuesday": $scope.day = $scope.days[2];
                break;
                case "Wednesday": $scope.day = $scope.days[3];
                break;
                case "Thursday": $scope.day = $scope.days[4];
                break;
                case "Friday": $scope.day = $scope.days[5];
                break;
                case "Saturday": $scope.day = $scope.days[6];
                break;
                default: console.log("Scope.day is null or not of the 7 days");
                break;
            }
        }

        $scope.updateClassItem = function(classItem,day){
            ref.child("users").child($rootScope.userId).child("class").child($scope.classItem.key).update({
                classDay: day.named,
                classNamed: classItem.classNamed,
                classVenue: classItem.classVenue,
                classStartTime: classItem.classStartTime,
                classEndTime: classItem.classEndTime
            });
            $scope.getClassTimetable($rootScope.userId);
            $scope.editClassModal.hide();
        }

        $scope.deleteFromFirebase = function() {
            ref.child("users").child($rootScope.userId).child("class").child($scope.classItem.key).remove();
            console.log($scope.classItem.Key + " deleted");
            $scope.getClassTimetable($rootScope.userId);
            $scope.itemOptionModal.hide();
        }
    }
})

.controller('GroupCtrl', function ($scope, $rootScope, $state, $ionicPopup) {
    console.log("We are at GroupCtrl");
    if(!$rootScope.signedIn||$rootScope.signedIn===undefined){
        // An alert dialog
        var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'You are not logged in, please log in first'
        });
        alertPopup.then(function(res) {
            $state.go('login');
        });
    } else {

    }
})

.controller('TimelineController', function ($scope, $rootScope, $state, $ionicPopup) {
    console.log("We are at TimelineController");
    if(!$rootScope.signedIn||$rootScope.signedIn===undefined){
        // An alert dialog
        var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'You are not logged in, please log in first'
        });
        alertPopup.then(function(res) {
            $state.go('login');
        });
    } else {

    }
})

.controller('DiscussionCtrl', function ($scope, $rootScope, $state, $ionicPopup) {
    console.log("We are at DiscussionCtrl");
    if(!$rootScope.signedIn||$rootScope.signedIn===undefined){
        // An alert dialog
        var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'You are not logged in, please log in first'
        });
        alertPopup.then(function(res) {
            $state.go('login');
        });
    } else {

    }
})

.controller('TaskCtrl', function ($scope, $rootScope, $state, $ionicPopup) {
    console.log("We are at TaskCtrl");
    if(!$rootScope.signedIn||$rootScope.signedIn===undefined){
        // An alert dialog
        var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'You are not logged in, please log in first'
        });
        alertPopup.then(function(res) {
            $state.go('login');
        });
    } else {
        
    }
})