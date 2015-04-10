angular.module("mapal.controllers", [])

.controller("LoginCtrl", function ($scope, $ionicModal, $state, $firebaseAuth, $ionicLoading, $rootScope, $ionicPopup) {

    var ref = new Firebase($rootScope.firebaseUrl);
    var auth = $firebaseAuth(ref);

    $ionicModal.fromTemplateUrl("templates/common/forgotPasswordModal.html", {
        scope: $scope
    }).then(function (forgotPasswordModal) {
        $scope.forgotPasswordModal = forgotPasswordModal;
    });

    $scope.resetPassword = function (emailAddress) {
        $ionicLoading.show({
            template: 'Sending Email...'
        });
        ref.resetPassword({
            email : emailAddress
          }, function(error) {
          if (error === null) {
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: "SUCCESS",
                template: "Password reset email sent successfully"
            });
          } else {
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: "ERROR",
                template: "Error sending password reset email: " + error
            });
          }
        });
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
                        $rootScope.groupId = val.groupId;
                        $rootScope.userId = authData.uid;
                        $rootScope.votedSprintPlanningDateTimeId = val.votedSprintPlanningDateTimeId;
                        $rootScope.votedScrumPlanningDateTimeId = val.votedScrumPlanningDateTimeId;
                        $rootScope.votedSprintReviewDateTimeId = val.votedSprintReviewDateTimeId;
                        $rootScope.votedSprintRetrospectiveDateTimeId = val.votedSprintRetrospectiveDateTimeId;
                        $rootScope.signedIn = true;
                        $rootScope.showMyAccount = true;
                        $rootScope.showLogout = true;
                    });
                    
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
                            $state.go('studentAddClassSchedule');
                        } else {
                            if($rootScope.groupId == null){
                                $ionicLoading.hide();
                                $state.go('student-viewGroupList');
                            }else{

                                //Get group data from Firebase
                                ref.child("groups").child($rootScope.groupId).once('value', function (snapshot) {
                                    var val = snapshot.val();
                                    $ionicLoading.hide();
                                    if(val.groupStatus == "pending"){
                                        $state.go('student-viewGroupMemberList');
                                    } else if (val.groupStatus == "active"){
                                        $state.go('student-tab.timeline');
                                    } else if (val.groupStatus == "disabled"){
                                        console.log("Group status disabled. Not supposed to have this. Something went wrong somewhere");
                                    } else if (val.groupStatus == null){
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
                            $state.go('leaderAddClassSchedule');
                        } else {
                            if($rootScope.groupId == null){
                                $state.go('leader-CreateGroup');
                            }else{
                                //Get group data from Firebase
                                ref.child("groups").child($rootScope.groupId).once('value', function (snapshot) {
                                    var val = snapshot.val();
                                    
                                    if(val.groupStatus == "pending"){
                                        $state.go('leader-viewGroupMemberList');
                                    } else if (val.groupStatus == "active"){
                                        $state.go('leader-tab.timeline');
                                    } else if (val.groupStatus == "disabled"){
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
                        $state.go('lecturer-tab.report');
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

.controller("ClassScheduleCtrl", function ($scope, $rootScope, $ionicModal, $ionicLoading, $state, $ionicPopup, $firebaseAuth, $ionicHistory) {
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
            {named:'Monday'},
            {named:'Tuesday'},
            {named:'Wednesday'},
            {named:'Thursday'},
            {named:'Friday'},
        ];
        $scope.day = $scope.days[0]; // Monday

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

        //classItemOptionModal
        $ionicModal.fromTemplateUrl('templates/common/classItemOptionModal.html', {
            scope: $scope
        }).then(function (classItemOptionModal) {
            $scope.classItemOptionModal = classItemOptionModal;
        });
        

        var ref = new Firebase($rootScope.firebaseUrl);

        //Create new class
        $scope.createNewClassSchedule = function (userClass,day) {
            console.log("Create new class function called");

            if (userClass && userClass.classNamed && userClass.classVenue) {
                $ionicLoading.show({
                    template: 'Creating new class...'
                });

                var userClassID = "class"+String(day.named);
                console.log(userClassID)

                var userRef = ref.child("users").child($rootScope.userId).child("classSchedule");
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
                    console.log("HAHAHAHA Error! classSchedule");
                };
                
                $ionicLoading.hide();
                $scope.newClassModal.hide();
                $scope.getClassTimetable($rootScope.userId);
                
            } else
                alert("Please fill all details");
        }

        $scope.getClassTimetable = function(userID){
            var classRef = ref.child("users").child(userID).child("classSchedule");

            $scope.mondayList = [];
            $scope.tuesdayList = [];
            $scope.wednesdayList = [];
            $scope.thursdayList = [];
            $scope.fridayList = [];
            $scope.saturdayList = [];
            $scope.sundayList = [];

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
                    case "Saturday":{
                        $scope.saturdayList.push(value);
                    }
                    break;
                    case "Sunday":{
                        $scope.sundayList.push(value);
                    }
                    break;
                    default: console.log("ERROR!! dayOfClass: "+dayOfClass);
                    break;
                }
            });
        }

        $scope.goViewGroupList = function(){
            if($rootScope.role == 'student'){
                console.log("student role to view group list");
                $state.go('student-viewGroupList');
            } else if ($rootScope.role == 'leader') {
                console.log("leader role to create group");
                $state.go('leader-CreateGroup');
            } else {
                console.log("role: "+$rootScope.role);
            }
            
        }

        $scope.editClassSchedule = function(classItem){
            $scope.classItemOptionModal.show();
            $scope.classItem = classItem;
            console.log("classitem.classStartTime: "+$scope.classItem.classStartTime);
            console.log("classitem.classEndTime: "+$scope.classItem.classEndTime);
        }

        $scope.editClass = function(){
            $scope.classItemOptionModal.hide();
            $scope.editClassModal.show();
            switch($scope.classItem.classDay){
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
                default: console.log("Scope.day is null or not of the 7 days");
                break;
            }
        }

        $scope.updateClassItem = function(classItem,day){
            ref.child("users").child($rootScope.userId).child("classSchedule").child($scope.classItem.key).update({
                classDay: day.named,
                classNamed: classItem.classNamed,
                classVenue: classItem.classVenue,
                classStartTime: classItem.classStartTime,
                classEndTime: classItem.classEndTime
            });
            $scope.getClassTimetable($rootScope.userId);
            $scope.editClassModal.hide();
        }

        $scope.deleteClassFromFirebase = function() {
            ref.child("users").child($rootScope.userId).child("classSchedule").child($scope.classItem.key).remove();
            console.log($scope.classItem.Key + " deleted");
            $scope.getClassTimetable($rootScope.userId);
            $scope.classItemOptionModal.hide();
        }

        $scope.goBack = function(){
            $ionicHistory.goBack()
        }

        $scope.getClassTimetable($rootScope.userId);
    }
})

.controller("GroupCtrl", function ($scope, $rootScope, $state, $ionicPopup, $ionicModal) {
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
        console.log("We are at GroupCtrl");
        var ref = new Firebase($rootScope.firebaseUrl);
        
        $scope.taskList = [];

        var taskRef = ref.child("tasks");
        taskRef.orderByChild("taskName").on("child_added", function (snapshot) {
            var value = snapshot.val();
            value.key = String(snapshot.key());
            $scope.taskList.push(value);
            $scope.Task = $scope.taskList[0];
        });

        $scope.leaderViewClassSchedule = function(){
            $state.go('leaderViewClassSchedule')
        }

        $scope.createGroup = function(group,Task){
            console.log("In CreateGRoup")
            $rootScope.group = {
                groupName : group.groupName,
                leaderName: $rootScope.fullName,
                taskName : Task.taskName,
                taskDescription : Task.taskDescription,
                taskGuideline : Task.taskGuideline,
                venue: group.venue
            };
            $state.go('leader-confirmCreateGroup');
        }

        $scope.confirmCreateGroup = function (group){
            console.log("In ConfirmCreateGroup")
            try{
                var groupRef = ref.child("groups").push({
                    groupName: group.groupName,
                    leaderName: group.leaderName,
                    groupStartDate: Firebase.ServerValue.TIMESTAMP,
                    groupTask: group.taskName,
                    groupTaskDescription: group.taskDescription,
                    groupTaskGuideline: group.taskGuideline,
                    groupVenue: group.venue,
                    groupStatus: "pending"
                });
                ref.child("users").child($rootScope.userId).update({
                    groupId: groupRef.key()
                });
                $rootScope.groupId = groupRef.key();
                $state.go('leader-viewGroupMemberList');
            }catch(error) {
                console.log("HAHAHAHA Error! createGroup");
            };
        }

        //editGroupModal
        $ionicModal.fromTemplateUrl('templates/common/editGroupModal.html', {
            scope: $scope
        }).then(function (editGroupModal) {
            $scope.editGroupModal = editGroupModal;
        });

        $scope.editCreateGroup = function (group) {
            $scope.editGroupModal.show();
            $scope.groupItem = group;
            for (var item in $scope.taskList){
                if ($scope.groupItem.taskName==item.taskName){
                    $scope.Task = item;
                }
            }
        }

        $scope.updateGroupItem = function(groupItem,Task){
            $scope.editGroupModal.hide();
        }
    }
})

.controller("ViewGroupMemberListCtrl", function ($scope, $rootScope, $state, $ionicPopup) {
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
        console.log("We are at ViewGroupMemberListCtrl");

        var ref = new Firebase($rootScope.firebaseUrl);

        $scope.userList = [];

        $scope.initialise = function (){

            ref.child("groups").child($rootScope.groupId).once('value', function (snapshot) {
                var value = snapshot.val();
                $scope.groupName = value.groupName;
            });

            ref.child("users").orderByChild("groupId").on("child_added", function (snapshot) {
                var value = snapshot.val();
                if(value.groupId == $rootScope.groupId){
                    value.key = String(snapshot.key());
                    $scope.userList.push(value);
                }
            });

        }

        $scope.studentViewClassSchedule = function(){
            $state.go('studentViewClassSchedule')
        }

        $scope.leaderViewClassSchedule = function(){
            $state.go('leaderViewClassSchedule')
        }

        $scope.closeGroup = function (groupMemberInfo) {
            $scope.members = [];
            groupMemberInfo.forEach(function(element,index){
                $scope.members.push(element.key);
            });


            ref.child("groups").child($rootScope.groupId).update({
                groupStatus: "active",
                groupNoOfMembers: $scope.members.length,
                groupMembers: {
                    members: $scope.members
                }
            });
            $state.go('leader-tab.timeline');
        }

        $scope.initialise();
    }
})

.controller("ViewGroupListCtrl", function ($scope, $rootScope, $state, $ionicPopup) {
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
        console.log("We are at ViewGroupListCtrl");

        $scope.groupList = [];

        var ref = new Firebase($rootScope.firebaseUrl);

        ref.child("groups").orderByChild("groupName").on("child_added", function (snapshot) {
            var value = snapshot.val();
            
            if(value.groupStatus == 'pending'){
                value.key = String(snapshot.key());
                $scope.groupList.push(value);
            }
        });
        
        $scope.studentViewClassSchedule = function(){
            $state.go('studentViewClassSchedule')
        }

        $scope.joinGroup = function(item){
            ref.child("groups").child(item.key).child("groupNoOfMembers").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value >= 5){
                    var alertPopup = $ionicPopup.alert({
                        title: "Error",
                        template: "This group is full"
                    });
                    alertPopup.then(function(res) {
                        //Do something?
                    });
                } else if ((value < 5)&&(value > 0)){
                    $scope.groupJoin(item);
                }
            });
        }

        $scope.groupJoin = function(item){
            ref.child("users").child($rootScope.userId).update({
                groupId: item.key
            });
            $rootScope.groupId = item.key;
            $state.go('student-viewGroupMemberList');
        }
    }
})

.controller("TimelineController", function ($scope, $rootScope, $state, $ionicPopup) {
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
        console.log("We are at TimelineController");

        var ref = new Firebase($rootScope.firebaseUrl);

        $scope.initialise = function (){
            $scope.mondayList = [];
            $scope.tuesdayList = [];
            $scope.wednesdayList = [];
            $scope.thursdayList = [];
            $scope.fridayList = [];

            for (var i = 8; i < 19; i++){
                $scope.mondayList.push({
                    time: i,
                    sprintPlanningMondayCount: 0,
                    scrumPlanningMonday1Count: 0,
                    scrumPlanningMonday2Count: 0,
                    sprintReviewMondayCount: 0,
                    sprintRetrospectiveMondayCount: 0,
                    me: ""
                });
                $scope.tuesdayList.push({
                    time: i,
                    sprintPlanningTuesdayCount: 0,
                    scrumPlanningTuesday1Count: 0,
                    scrumPlanningTuesday2Count: 0,
                    sprintReviewTuesdayCount: 0,
                    sprintRetrospectiveTuesdayCount: 0,
                    me: ""
                });
                $scope.wednesdayList.push({
                    time: i,
                    sprintPlanningWednesdayCount: 0,
                    scrumPlanningWednesday1Count: 0,
                    scrumPlanningWednesday2Count: 0,
                    sprintReviewWednesdayCount: 0,
                    sprintRetrospectiveWednesdayCount: 0,
                    me: ""
                });
                $scope.thursdayList.push({
                    time: i,
                    sprintPlanningThursdayCount: 0,
                    scrumPlanningThursday1Count: 0,
                    scrumPlanningThursday2Count: 0,
                    sprintReviewThursdayCount: 0,
                    sprintRetrospectiveThursdayCount: 0,
                    me: ""
                });
                $scope.fridayList.push({
                    time: i,
                    sprintPlanningFridayCount: 0,
                    scrumPlanningFriday1Count: 0,
                    scrumPlanningFriday2Count: 0,
                    sprintReviewFridayCount: 0,
                    sprintRetrospectiveFridayCount: 0,
                    me: ""
                });
            }
            
            var userList = [];
            $scope.showSprintPlanningList = false;
            $scope.showScrumPlanningList = false;
            $scope.showSprintReviewList = false;
            $scope.showSprintRetrospectiveList = false;

            $scope.showConfirmedSprintPlanningTime = false;
            $scope.showConfirmedScrumPlanningTime = false;
            $scope.showConfirmedSprintReviewTime = false;
            $scope.showConfirmedSprintRetrospectiveTime = false;

            $scope.showSprintPlanningMondayCount = false;
            $scope.showSprintPlanningTuesdayCount = false;
            $scope.showSprintPlanningWednesdayCount = false;
            $scope.showSprintPlanningThursdayCount = false;
            $scope.showSprintPlanningFridayCount = false;

            $scope.showScrumPlanningMonday1Count = false;
            $scope.showScrumPlanningTuesday1Count = false;
            $scope.showScrumPlanningWednesday1Count = false;
            $scope.showScrumPlanningThursday1Count = false;
            $scope.showScrumPlanningFriday1Count = false;
            $scope.showScrumPlanningMonday2Count = false;
            $scope.showScrumPlanningTuesday2Count = false;
            $scope.showScrumPlanningWednesday2Count = false;
            $scope.showScrumPlanningThursday2Count = false;
            $scope.showScrumPlanningFriday2Count = false;

            $scope.showSprintReviewMondayCount = false;
            $scope.showSprintReviewTuesdayCount = false;
            $scope.showSprintReviewWednesdayCount = false;
            $scope.showSprintReviewThursdayCount = false;
            $scope.showSprintReviewFridayCount = false;

            $scope.showSprintRetrospectiveMondayCount = false;
            $scope.showSprintRetrospectiveTuesdayCount = false;
            $scope.showSprintRetrospectiveWednesdayCount = false;
            $scope.showSprintRetrospectiveThursdayCount = false;
            $scope.showSprintRetrospectiveFridayCount = false;

            $scope.toShowSprintPlanning = "";
            $scope.toShowScrumPlanning = "";
            $scope.toShowSprintReview = "";
            $scope.toShowSprintRetrospective = "";

            var getServerTime = (function(ref) {
                var offset = 0;
                ref.child('.info/serverTimeOffset').on('value', function(snap) {
                   offset = snap.val();
                });

                return function() {
                   return Date.now() + offset;
                }
            })(ref);
            //getServerTime() returns time in ms. toUTCString() change it to eg: Tue, 31 Mar 2015 14:57:47 GMT
            var estimatedServerTimeMs = new Date(getServerTime()); 
            console.log("estimatedServerTimeMs: "+estimatedServerTimeMs);
            var serverTime = estimatedServerTimeMs.toUTCString();
            console.log("server time: "+serverTime);


            $scope.getGroupMembersId($rootScope.groupId);
            $scope.getConfirmedTime($rootScope.groupId);
        }

        $scope.getConfirmedTime = function (groupId){
            //Get venue
            ref.child("groups").child(groupId).child("groupVenue").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.confirmedVenue = "Venue not set";
                } else {
                    $scope.confirmedVenue = value;
                }
            });

            //Get group created date time in utc ms format
            ref.child("groups").child(groupId).child("groupStartDate").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.groupStartDate = "group start date not set. is an error!";
                } else {
                    $scope.groupStartDate = value;
                }
            });

            //Get sprint planning confirmed date time
            ref.child("groups").child(groupId).child("confirmedSprintPlanningDateTime").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.toShowSprintPlanning = "showSprintPlanningList";
                    $scope.getSprintPlanningInfo();
                } else {
                    $scope.toShowSprintPlanning = "showConfirmedSprintPlanningTime";
                    $scope.confirmedSprintPlanningDate = value.confirmedDate;
                    $scope.confirmedSprintPlanningTime = value.confirmedTime;
                }
            });

            //Get scrum planning confirmed date time
            ref.child("groups").child(groupId).child("confirmedScrumPlanningDateTime").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.toShowScrumPlanning = "showScrumPlanningList";
                    $scope.getScrumPlanningInfo($scope.groupStartDate);
                } else {
                    $scope.toShowScrumPlanning = "showConfirmedScrumPlanningTime";
                    $scope.confirmedScrumPlanningDate = value.confirmedDate;
                    $scope.confirmedScrumPlanningTime = value.confirmedTime;
                }
            });

            //Get sprint review confirmed date time
            ref.child("groups").child(groupId).child("confirmedSprintReviewDateTime").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.toShowSprintReview = "showSprintReviewList";
                    $scope.getSprintReviewInfo();
                } else {
                    $scope.toShowSprintReview = "showConfirmedSprintReviewTime";
                    $scope.confirmedSprintReviewDate = value.confirmedDate;
                    $scope.confirmedSprintReviewTime = value.confirmedTime;
                }
            });

            //Get sprint retrospective confirmed date time
            ref.child("groups").child(groupId).child("confirmedSprintRetrospectiveDateTime").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.toShowSprintRetrospective = "showSprintRetrospectiveList";
                    $scope.getSprintRetrospectiveInfo();
                } else {
                    $scope.toShowSprintRetrospective = "showConfirmedSprintRetrospectiveTime";
                    $scope.confirmedSprintRetrospectiveDate = value.confirmedDate;
                    $scope.confirmedSprintRetrospectiveTime = value.confirmedTime;
                }
            });

        }

        $scope.getUsersTimetable = function (userKey) {
            ref.child("users").child(userKey).child("classSchedule").orderByChild("classDay").on("child_added", function (snapshot) {
                var value = snapshot.val();
                var dayOfClass = value.classDay;
                var classStartTimeHourArray = value.classStartTime.split(":");
                var classEndTimeHourArray = value.classEndTime.split(":");
                //change the hour from string to number
                var classStartTimeHour = parseInt(classStartTimeHourArray[0]);
                var classEndTimeHour = Math.ceil(parseInt(classEndTimeHourArray[0]));

                switch(dayOfClass){
                    case "Friday":{
                        while(classStartTimeHour != (classEndTimeHour)){
                            var index = $scope.fridayList.indexOf(classStartTimeHour);
                            if(index > -1){
                                $scope.fridayList.splice(index,1);
                            }
                            classStartTimeHour++;
                        }
                    }
                    break;
                    case "Monday":{
                        while(classStartTimeHour != (classEndTimeHour)){
                            var index = $scope.mondayList.indexOf(classStartTimeHour);
                            if(index > -1){
                                $scope.mondayList.splice(index,1);
                            }
                            classStartTimeHour++;
                        }
                    }
                    break;
                    case "Tuesday":{
                        while(classStartTimeHour != (classEndTimeHour)){
                            var index = $scope.tuesdayList.indexOf(classStartTimeHour);
                            if(index > -1){
                                $scope.tuesdayList.splice(index,1);
                            }
                            classStartTimeHour++;
                        }
                    }
                    break;
                    case "Thursday":{
                        while(classStartTimeHour != (classEndTimeHour)){
                            var index = $scope.thursdayList.indexOf(classStartTimeHour);
                            if(index > -1){
                                $scope.thursdayList.splice(index,1);
                            }
                            classStartTimeHour++;
                        }
                    }
                    break;
                    case "Wednesday":{
                        while(classStartTimeHour != (classEndTimeHour)){
                            var index = $scope.wednesdayList.indexOf(classStartTimeHour);
                            if(index > -1){
                                $scope.wednesdayList.splice(index,1);
                            }
                            classStartTimeHour++;
                        }
                    }
                    break;
                    default: console.log("ERROR!! dayOfClass: "+dayOfClass);
                    break;
                }
            });
        }

        $scope.getGroupMembersId = function(groupId){
            ref.child("groups").child(groupId).child("groupMembers").child("members").on("child_added", function (snapshot) {
                var value = snapshot.val();
                console.log("value here: "+ value);
                $scope.getUsersTimetable(value);
            });
        }

        $scope.showSprintPlanning = function () {
            if ($scope.showSprintPlanningList||$scope.showConfirmedSprintPlanningTime){
                $scope.showSprintPlanningList=false;
                $scope.showConfirmedSprintPlanningTime = false;
            } else {
                if($scope.toShowSprintPlanning == "showSprintPlanningList"){
                    $scope.showConfirmedSprintPlanningTime = false;
                    $scope.showSprintPlanningList = true;
                } else if ($scope.toShowSprintPlanning == "showConfirmedSprintPlanningTime"){
                    $scope.showSprintPlanningList=false;
                    $scope.showConfirmedSprintPlanningTime = true;
                }
            }
        }

        $scope.showScrumPlanning = function () {
            if ($scope.showScrumPlanningList||$scope.showConfirmedScrumPlanningTime){
                $scope.showScrumPlanningList=false;
                $scope.showConfirmedScrumPlanningTime = false;
            } else {
                if($scope.toShowScrumPlanning == "showScrumPlanningList"){
                    $scope.showScrumPlanningList = true;
                    $scope.showConfirmedScrumPlanningTime = false;
                } else if ($scope.toShowScrumPlanning == "showConfirmedScrumPlanningTime"){
                    $scope.showScrumPlanningList=false;
                    $scope.showConfirmedScrumPlanningTime = true;
                }
            }
        }
             
        $scope.showSprintReview = function () {
            if ($scope.showSprintReviewList||$scope.showConfirmedSprintReviewTime){
                $scope.showSprintReviewList=false;
                $scope.showConfirmedSprintReviewTime=false;
            } else {
                if($scope.toShowSprintReview == "showSprintReviewList"){
                    $scope.showSprintReviewList = true;
                    $scope.showConfirmedSprintReviewTime=false;
                } else if ($scope.toShowSprintReview == "showConfirmedSprintReviewTime"){
                    $scope.showSprintReviewList=false;
                    $scope.showConfirmedSprintReviewTime = true;
                }
            }
        }

        $scope.showSprintRetrospective = function () {
            if ($scope.showSprintRetrospectiveList||$scope.showConfirmedSprintRetrospectiveTime){
                $scope.showSprintRetrospectiveList=false;
                $scope.showConfirmedSprintRetrospectiveTime=false;
            } else {
                if($scope.toShowSprintRetrospective == "showSprintRetrospectiveList"){
                    $scope.showSprintRetrospectiveList=true;
                    $scope.showConfirmedSprintRetrospectiveTime=false;
                } else if ($scope.toShowSprintRetrospective == "showConfirmedSprintRetrospectiveTime"){
                    $scope.showSprintRetrospectiveList=false;
                    $scope.showConfirmedSprintRetrospectiveTime=true;  
                }
            }
        }

        $scope.getSprintPlanningInfo = function() {
            if($rootScope.votedSprintPlanningDateTimeId != null){
                ref.child("groups").child($rootScope.groupId).child("voteSprintPlanningDateTime").child($rootScope.votedSprintRetrospectiveDateTimeId).once('value', function (snapshot) {
                    var value = snapshot.val();
                    if(value != null){
                        var votedDay = new Date(value.voteDate).getDay();
                        var voteTime = value.voteTime;

                        switch(votedDay) {
                            case 0:
                                $scope.sundayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 1:
                                $scope.mondayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 2:
                                $scope.tuesdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 3:
                                $scope.wednesdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 4:
                                $scope.thursdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 5:
                                $scope.fridayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 6:
                                $scope.saturdayList[voteTime-8].me = "MY VOTE";
                                break;
                            default:
                                console.log ("err, error?");
                                break;
                        }
                    } else {
                        console.log ("getSprintPlanningInfo val is null");
                    }
                });
            }

            ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospectiveDateTime").orderByChild("count").on("child_added", function (snapshot) {
                var value = snapshot.val();
                var key = String(snapshot.key());

                if((value != null)&&(key != "voteCount")){
                    var votedDay = new Date(value.voteDate).getDay();
                    var voteTime = value.voteTime;

                    switch(votedDay) {
                        case 0:
                            $scope.sundayList[voteTime-8].sprintPlanningSundayCount = value.count;
                            break;
                        case 1:
                            $scope.mondayList[voteTime-8].sprintPlanningMondayCount = value.count;
                            break;
                        case 2:
                            $scope.tuesdayList[voteTime-8].sprintPlanningTuesdayCount = value.count;
                            break;
                        case 3:
                            $scope.wednesdayList[voteTime-8].sprintPlanningWednesdayCount = value.count;
                            break;
                        case 4:
                            $scope.thursdayList[voteTime-8].sprintPlanningThursdayCount = value.count;
                            break;
                        case 5:
                            $scope.fridayList[voteTime-8].sprintPlanningFridayCount = value.count;
                            break;
                        case 6:
                            $scope.saturdayList[voteTime-8].sprintPlanningSaturdayCount = value.count;
                            break;
                        default:
                            console.log ("err, error?");
                            break;
                    }
                } else {
                    console.log ("getSprintPlanningInfo val is null");
                }
            });
        }
                    // scrumPlanningThursday1Count: 0,
                    // scrumPlanningThursday2Count: 0,
        $scope.getScrumPlanningInfo = function(groupStartDate) {
            if($rootScope.votedScrumPlanningDateTimeId != null){
                ref.child("groups").child($rootScope.groupId).child("voteScrumPlanningDateTime").child($rootScope.votedSprintRetrospectiveDateTimeId).once('value', function (snapshot) {
                    var value = snapshot.val();
                    if(value != null){
                        var votedDay = new Date(value.voteDate).getDay();
                        var voteTime = value.voteTime;

                        switch(votedDay) {
                            case 0:
                                $scope.sundayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 1:
                                $scope.mondayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 2:
                                $scope.tuesdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 3:
                                $scope.wednesdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 4:
                                $scope.thursdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 5:
                                $scope.fridayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 6:
                                $scope.saturdayList[voteTime-8].me = "MY VOTE";
                                break;
                            default:
                                console.log ("err, error?");
                                break;
                        }
                        
                    } else {
                        console.log ("getScrumPlanningInfo val is null");
                    }
                });
            } 
            ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospectiveDateTime").orderByChild("count").on("child_added", function (snapshot) {
                var value = snapshot.val();
                var key = String(snapshot.key());

                if((value != null)&&(key != "voteCount")){
                    var votedDay = new Date(value.voteDate).getDay();
                    var voteTime = value.voteTime;

                    switch(votedDay) {
                        case 0:
                            $scope.sundayList[voteTime-8].sprintRetrospectiveSundayCount = value.count;
                            break;
                        case 1:
                            $scope.mondayList[voteTime-8].sprintRetrospectiveMondayCount = value.count;
                            break;
                        case 2:
                            $scope.tuesdayList[voteTime-8].sprintRetrospectiveTuesdayCount = value.count;
                            break;
                        case 3:
                            $scope.wednesdayList[voteTime-8].sprintRetrospectiveWednesdayCount = value.count;
                            break;
                        case 4:
                            $scope.thursdayList[voteTime-8].sprintRetrospectiveThursdayCount = value.count;
                            break;
                        case 5:
                            $scope.fridayList[voteTime-8].sprintRetrospectiveFridayCount = value.count;
                            break;
                        case 6:
                            $scope.saturdayList[voteTime-8].sprintRetrospectiveSaturdayCount = value.count;
                            break;
                        default:
                            console.log ("err, error?");
                            break;
                    }
                } else {
                    console.log ("getScrumPlanningInfo val is null");
                }
            });
        }

        $scope.getSprintReviewInfo = function() {
            if($rootScope.votedSprintReviewDateTimeId != null){
                ref.child("groups").child($rootScope.groupId).child("voteSprintReviewDateTime").child($rootScope.votedSprintRetrospectiveDateTimeId).once('value', function (snapshot) {
                    var value = snapshot.val();
                    if(value != null){
                        var votedDay = new Date(value.voteDate).getDay();
                        var voteTime = value.voteTime;

                        switch(votedDay) {
                            case 0:
                                $scope.sundayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 1:
                                $scope.mondayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 2:
                                $scope.tuesdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 3:
                                $scope.wednesdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 4:
                                $scope.thursdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 5:
                                $scope.fridayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 6:
                                $scope.saturdayList[voteTime-8].me = "MY VOTE";
                                break;
                            default:
                                console.log ("err, error?");
                                break;
                        }
                        
                    } else {
                        console.log ("getSprintReviewInfo val is null");
                    }
                });
            }
            ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospectiveDateTime").orderByChild("count").on("child_added", function (snapshot) {
                var value = snapshot.val();
                var key = String(snapshot.key());

                if((value != null)&&(key != "voteCount")){
                    var votedDay = new Date(value.voteDate).getDay();
                    var voteTime = value.voteTime;

                    switch(votedDay) {
                        case 0:
                            $scope.sundayList[voteTime-8].sprintReviewSundayCount = value.count;
                            break;
                        case 1:
                            $scope.mondayList[voteTime-8].sprintReviewMondayCount = value.count;
                            break;
                        case 2:
                            $scope.tuesdayList[voteTime-8].sprintReviewTuesdayCount = value.count;
                            break;
                        case 3:
                            $scope.wednesdayList[voteTime-8].sprintReviewWednesdayCount = value.count;
                            break;
                        case 4:
                            $scope.thursdayList[voteTime-8].sprintReviewThursdayCount = value.count;
                            break;
                        case 5:
                            $scope.fridayList[voteTime-8].sprintReviewFridayCount = value.count;
                            break;
                        case 6:
                            $scope.saturdayList[voteTime-8].sprintReviewSaturdayCount = value.count;
                            break;
                        default:
                            console.log ("err, error?");
                            break;
                    }
                } else {
                    console.log ("getSprintReviewInfo val is null");
                }
            });
        }

        $scope.getSprintRetrospectiveInfo = function() {
            if($rootScope.votedSprintRetrospectiveDateTimeId != null){
                ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospectiveDateTime").child($rootScope.votedSprintRetrospectiveDateTimeId).once('value', function (snapshot) {
                    var value = snapshot.val();
                    if(value != null){
                        var votedDay = new Date(value.voteDate).getDay();
                        var voteTime = value.voteTime;

                        switch(votedDay) {
                            case 0:
                                $scope.sundayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 1:
                                $scope.mondayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 2:
                                $scope.tuesdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 3:
                                $scope.wednesdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 4:
                                $scope.thursdayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 5:
                                $scope.fridayList[voteTime-8].me = "MY VOTE";
                                break;
                            case 6:
                                $scope.saturdayList[voteTime-8].me = "MY VOTE";
                                break;
                            default:
                                console.log ("err, error?");
                                break;
                        }
                        
                    } else {
                        console.log ("getSprintRetrospectiveInfo val is null");
                    }
                });
            }

            ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospectiveDateTime").orderByChild("count").on("child_added", function (snapshot) {
                var value = snapshot.val();
                var key = String(snapshot.key());

                if((value != null)&&(key != "voteCount")){
                    var votedDay = new Date(value.voteDate).getDay();
                    var voteTime = value.voteTime;

                    switch(votedDay) {
                        case 0:
                            $scope.sundayList[voteTime-8].sprintRetrospectiveSundayCount = value.count;
                            break;
                        case 1:
                            $scope.mondayList[voteTime-8].sprintRetrospectiveMondayCount = value.count;
                            break;
                        case 2:
                            $scope.tuesdayList[voteTime-8].sprintRetrospectiveTuesdayCount = value.count;
                            break;
                        case 3:
                            $scope.wednesdayList[voteTime-8].sprintRetrospectiveWednesdayCount = value.count;
                            break;
                        case 4:
                            $scope.thursdayList[voteTime-8].sprintRetrospectiveThursdayCount = value.count;
                            break;
                        case 5:
                            $scope.fridayList[voteTime-8].sprintRetrospectiveFridayCount = value.count;
                            break;
                        case 6:
                            $scope.saturdayList[voteTime-8].sprintRetrospectiveSaturdayCount = value.count;
                            break;
                        default:
                            console.log ("err, error?");
                            break;
                    }
                } else {
                    console.log ("getSprintRetrospectiveInfo val is null");
                }
            });
        }
        
        $scope.selectDateTime = function(time, date) {

        }

        $scope.initialise();
    }
})

.controller("DiscussionCtrl", function ($scope, $rootScope, $state, $ionicPopup) {
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
        console.log("We are at DiscussionCtrl");

        var ref = new Firebase($rootScope.firebaseUrl);
    }
})

.controller("TaskCtrl", function ($scope, $rootScope, $state,  $ionicModal, $ionicPopup, $ionicLoading) {
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
        console.log("We are at TaskCtrl");

        var ref = new Firebase($rootScope.firebaseUrl);

        //itemOptionModal
        $ionicModal.fromTemplateUrl('templates/common/taskItemOptionModal.html', {
            scope: $scope
        }).then(function (taskItemOptionModal) {
            $scope.taskItemOptionModal = taskItemOptionModal;
        });

        //lecturerCreateGuidelineModal
        $ionicModal.fromTemplateUrl('templates/lecturer/lecturerCreateGuidelineModal.html', {
            scope: $scope
        }).then(function (lecturerCreateGuidelineModal) {
            $scope.lecturerCreateGuidelineModal = lecturerCreateGuidelineModal;
        });

        //editTaskModal
        $ionicModal.fromTemplateUrl('templates/common/editTaskModal.html', {
            scope: $scope
        }).then(function (editTaskModal) {
            $scope.editTaskModal = editTaskModal;
        });

        //closegroup confirmation
        $ionicModal.fromTemplateUrl('templates/common/closeGroupConfirmationModal.html', {
            scope: $scope
        }).then(function (closeGroupConfirmationModal) {
            $scope.closeGroupConfirmationModal = closeGroupConfirmationModal;
        });

        //closegroup
        $ionicModal.fromTemplateUrl('templates/common/closeGroupModal.html', {
            scope: $scope
        }).then(function (closeGroupModal) {
            $scope.closeGroupModal = closeGroupModal;
        });

        if($rootScope.role != 'lecturer'){
            $ionicLoading.show({
                template: 'Getting Tasks...'
            });
            ref.child("groups").child($rootScope.groupId).once('value', function (snapshot) {
                var val = snapshot.val();
                $scope.myTask = val;
                $ionicLoading.hide();
            });
        }

        $scope.closeGroup = function(grade){

            ref.child("groups").child($rootScope.groupId).update({
                groupStatus: 'disabled',
                groupGrade: grade.toUpperCase()
            });

            ref.child("users").orderByChild("groupId").on("child_added", function (snapshot) {
                var value = snapshot.val();
                if(value.groupId == $rootScope.groupId){
                    value.key = String(snapshot.key());
                    $scope.removeGroupIdFromUserList(value.key);
                }
            });

            $scope.closeGroupConfirmationModal.hide();
            $scope.closeGroupModal.show();
        }

        $scope.removeGroupIdFromUserList = function(userId){
            ref.child("users").child(userId).child("groupId").remove();
        }

        $scope.ok = function(){
            $scope.closeGroupModal.hide();
            if($rootScope.role == "student"){
                $state.go('studentAddClassSchedule');
            } else if ($rootScope.role == "leader") {
                $state.go('leaderAddClassSchedule');
            } else {
                console.log("role: "+$rootScope.role);
            }
        }

        $scope.confirmCreateTask = function(task) {
            $ionicLoading.show({
                template: 'Loading...'
            });
            $rootScope.task = task;
            ref.child("guidelines").child("count").once('value', function (snapshot) {
                if(snapshot.val()==null){
                    $scope.numberOfGuidelines = 0;
                    console.log("snapshot.val is null");
                    $ionicLoading.hide();
                    $scope.lecturerCreateGuidelineModal.show();
                } else if (snapshot.val()>=0) {
                    $scope.numberOfGuidelines = snapshot.val();
                    console.log("snapshot.val is: "+$scope.numberOfGuidelines);
                    $scope.getGuidelines(task, $scope.numberOfGuidelines);
                }
            });
        }

        $scope.getGuidelines = function (task, guidelineNumber){
            console.log("snapshot.val is: "+guidelineNumber);
            var counter = 0;
            if(guidelineNumber > 0){
                ref.child("guidelines").orderByChild("keywords").on("child_added", function (snapshot) {
                    var value = snapshot.val();
                    value.key = String(snapshot.key());
                   
                    if((value.key != "count")&&(typeof value.keywords !== "undefined")){
                        var keywordInString = String(value.keywords);
                        var keywords = keywordInString.split(",");
                        console.log ("keywords: "+keywords+" : keywordInString: "+keywordInString);

                        if(counter==guidelineNumber){
                            $ionicLoading.hide();
                            console.log ("here?");
                            // create guidelines
                        } else if (counter<guidelineNumber){
                            for(i=0; i<keywords.length;i++){
                                //If keyword don't exist in task description, stop checking
                                if(!~task.taskDescription.indexOf(keywords[i].trim())){
                                    console.log("don't exist?");
                                    break;
                                }

                                if(i==keywords.length-1){
                                    $rootScope.guidelines = value;
                                    $ionicLoading.hide();
                                    console.log("all ok but?");
                                    $state.go("confirmCreateTask");
                                }
                            }
                        }
                        counter++;
                    }
                });
            }
        }

        $scope.createTaskConfirmed = function (task,guidelines) {
            ref.child("tasks").push({
                    taskName: task.taskName,
                    taskDescription: task.taskDescription,
                    taskGuideline: guidelines
                });
            $scope.getTaskCreated();
        }

        $scope.createGuideline = function (guidelines){
            $ionicLoading.show({
                template: 'Loading...'
            });
            var guidelineRef = ref.child("guidelines").push({
                keywords: guidelines.keyword,
                dataStructure: guidelines.dataStructure,
                dataType: guidelines.dataType,
                controlStructure: guidelines.controlStructure,
                arithmeticExpression: guidelines.arithmeticExpression
            });

            if(guidelineRef.key()!=null){
                ref.child("guidelines").child("count").once('value', function (snapshot) {
                    $scope.numberOfGuidelines = snapshot.val();
                    if($scope.numberOfGuidelines==null){
                        var onComplete = function(error) {
                            if (error) {
                                console.log('Synchronization failed');
                            } else {
                                console.log('Synchronization succeeded');
                            }
                        };
                        ref.child("guidelines").set({ count: 1}, onComplete);
                    } else if ($scope.numberOfGuidelines>0) {
                        var onComplete = function(error) {
                            if (error) {
                                console.log('Synchronization failed');
                            } else {
                                console.log('Synchronization succeeded');
                            }
                        };
                        ref.child("guidelines").set({ count: $scope.numberOfGuidelines+1}, onComplete);
                    }
                    $scope.guidelines = guidelines;
                    $scope.lecturerCreateGuidelineModal.hide();
                    $state.go("confirmCreateTask");
                });
                
                
            }
            $rootScope.guidelineId = guidelineRef.key();
        }



        $scope.showEditGuidelines = function (guidelines) {
            $scope.guidelines = guidelines;

        }

        $scope.createTask = function () {
            console.log("we are in createTask!");
            $state.go("createTask");
        }

        $scope.getTaskCreated = function(){
            $scope.taskList = [];

            var taskRef = ref.child("tasks");
            taskRef.orderByChild("taskName").on("child_added", function (snapshot) {
                var value = snapshot.val();
                value.key = String(snapshot.key());
                $scope.taskList.push(value);
            });
        }

        $scope.editTaskCreated = function(taskItem){
            $scope.taskItemOptionModal.show();
            $scope.taskItem = taskItem;
        }

        $scope.editTask = function(){
            $scope.taskItemOptionModal.hide();
            $scope.editTaskModal.show();
            $scope.taskItem = taskItem;
        }

        $scope.updateTaskItem = function(taskItem){
            //$scope.getGuidelines(taskItem);
            ref.child("tasks").child($scope.taskItem.key).update({
                taskName: taskItem.taskName,
                taskDescription: taskItem.taskDescription
                //TODO:update guidelines too
            });
            $scope.getTaskCreated();
            $scope.editTaskModal.hide();
        }

        $scope.deleteTaskFromFirebase = function() {
            ref.child("tasks").child($scope.taskItem.key).remove();
            console.log($scope.taskItem.Key + " deleted");
            $scope.getTaskCreated();
            $scope.taskItemOptionModal.hide();
        }

        $scope.viewTaskDetails = function (task){
            console.log("task: "+task);
            $rootScope.taskDetails = {
                taskName: task.taskName,
                taskDescription: task.taskDescription,
                taskGuidelines: task.guidelines
            }
            $state.go("tasksDetails");
        }

        $scope.getTaskCreated();

    }
})

.controller("StudentsCtrl", function ($scope, $rootScope, $state, $ionicPopup, $ionicModal, $firebaseAuth, $ionicLoading) {
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
        console.log("We are at StudentsCtrl");
        
        //Register user
        $ionicModal.fromTemplateUrl("templates/common/registerUserModal.html", {
            scope: $scope
        }).then(function (registerUserModal) {
            $scope.registerUserModal = registerUserModal;
        });

        //Edit user settings
        $ionicModal.fromTemplateUrl("templates/common/editUserSettingsModal.html", {
            scope: $scope
        }).then(function (editUserSettingsModal) {
            $scope.editUserSettingsModal = editUserSettingsModal;
        });

        //For dropdown list items
        $scope.roles = [
            {types:'student'},
            {types:'leader'},
            {types:'lecturer'}
        ];
        $scope.Role = $scope.roles[0]; // student

        var ref = new Firebase($rootScope.firebaseUrl);
        var auth = $firebaseAuth(ref);

        $scope.getStudentList = function () {
            $scope.leaderList = [];
            $scope.studentList = [];
            ref.child("users").orderByChild("role").on("child_added", function (snapshot) {
                var value = snapshot.val();
                var role = value.role;
                value.key = String(snapshot.key());
                switch(role){
                    case "leader":{
                        $scope.leaderList.push(value);
                    }
                    break;
                    case "student":{
                       $scope.studentList.push(value);
                    }
                    break;
                    case "lecturer":{
                        console.log("Lecturer: " + role);
                    }
                    break;
                    default: {
                        console.log("ERROR!! Role: "+role);
                        console.log("        key: "+value.key);
                        for(var propertyName in role) {
                           console.log("Object: "+role[propertyName]);
                        }
                    }
                    break;
                }
            });
        }

        $scope.createUser = function (user,Role) {
            console.log("Create User Function called");

            if(user.confirmPassword == user.password) {
                if (user && user.emailAddress && user.password && user.fullname && user.contactnumber && user.icnumber) {
                    $ionicLoading.show({
                        template: 'Registering User...'
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
                        $scope.registerUserModal.hide();
                    }).catch(function (error) {
                        alert("Error: " + error);
                        $ionicLoading.hide();
                    });
                } else{
                    alert("Please fill all details");
                }
            } else {
                alert("Please make sure your password is the same");
            }
        }  

        $scope.showEditUserSettingsModal = function (userInformations) {
            console.log("userInformations " + userInformations.key);
            $scope.editUserSettingsModal.show();
            $scope.userInformation = userInformations;
            for (var i=0; i < $scope.roles.length; i++) {
                console.log("Role out types: "+$scope.roles[i].types);
                if($scope.roles[i].types == userInformations.role){
                    $scope.Role = $scope.roles[i];
                    console.log("Role: "+$scope.roles[i].types);
                    break;
                }
            }
        }

        $scope.editStudentSetting = function (userInformation, Role) {
            ref.child("users").child(userInformation.key).update({
                role: Role.types
            });
            $scope.editUserSettingsModal.hide();
            $scope.getStudentList();
        }
        $scope.getStudentList();
    }
})

.controller("ReportCtrl", function ($scope, $rootScope, $state, $ionicPopup) {
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
        console.log("We are at ReportCtrl");

        var ref = new Firebase($rootScope.firebaseUrl);

        var groupTaskList = [];
        var groupList = [];

        $scope.initialise = function(){
            $scope.showGroupItems = false;
        }

        $scope.showGroupItem = function(){
            $scope.showGroupItems = true;
        }

        $scope.initialise();
    }
})

.controller("AccountSettingsCtrl", function ($scope, $rootScope, $state, $ionicPopup, $ionicModal, $ionicHistory, $ionicLoading){
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
        console.log("We are at UserCtrl");
        var ref = new Firebase($rootScope.firebaseUrl);
        
        //editAccountSettingsModal
        $ionicModal.fromTemplateUrl('templates/common/editAccountSettingsModal.html', {
            scope: $scope
        }).then(function (editAccountSettingsModal) {
            $scope.editAccountSettingsModal = editAccountSettingsModal;
        });

        $ionicLoading.show({
            template: 'Getting Account Information...'
        });

        ref.child("users").child($rootScope.userId).once('value', function (snapshot) {
            var val = snapshot.val();

            if($rootScope.role == "lecturer"){
                $rootScope.showGroupId = false;
            }

            console.log("email: "+val.email);
            console.log("fullName: "+val.fullName);
            console.log("groupId: "+val.groupId);
            console.log("icNumber: "+val.icNumber);
            console.log("contactNumber: "+val.contactNumber);
            $scope.userInfo = {
                userEmail : val.email,
                userFullName: val.fullName,
                userGroupID: val.groupId,
                userIcNumber: val.icNumber,
                userContactNumber: val.contactNumber
            }
            $ionicLoading.hide();
        });

        $scope.showEditInformationModal = function () {
            $scope.editAccountSettingsModal.show();
        }

        $scope.updateAccountSettings = function (userInfo) {
            console.log ("userInfo.userFullName: "+userInfo.userFullName);
            console.log ("userInfo.userIcNumber: "+userInfo.userIcNumber);
            console.log ("userInfo.userContactNumber: "+userInfo.userContactNumber);

            ref.child("users").child($rootScope.userId).update({
                fullName: userInfo.userFullName,
                icNumber: userInfo.userIcNumber,
                contactNumber: userInfo.userContactNumber
            });
            $scope.editAccountSettingsModal.hide();
            //$scope.userInformation();
        }

        $scope.userInformation = function () {
            ref.child("users").child($rootScope.userId).once('value', function (snapshot) {
                var val = snapshot.val();
                if($rootScope.role = "lecturer") {
                    $scope.userInfo = {
                        userEmail : val.email,
                        userFullName: val.fullName,
                        userIcNumber: val.icNumber,
                        userContactNumber: val.contactNumber
                    }
                } else {
                    $scope.userInfo = {
                        userEmail : val.email,
                        userFullName: val.fullName,
                        userGroupID: val.groupId,
                        userIcNumber: val.icNumber,
                        userContactNumber: val.contactNumber
                    }
                }
                
            });
        }

        $scope.back = function () {
            $ionicHistory.goBack();
        }  
    }
})

.controller("AboutUsCtrl", function ($scope, $rootScope, $state, $ionicHistory) {
    console.log("We are at ReportCtrl");

    $scope.back = function () {
        $ionicHistory.goBack();
    }   
})
