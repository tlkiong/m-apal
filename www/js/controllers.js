angular.module("mapal.controllers", [])

.controller("LoginCtrl", function ($scope, $ionicModal, $state, $firebaseAuth, $ionicLoading, $rootScope, $ionicPopup) {

    var ref = new Firebase($rootScope.firebaseUrl);
    var auth = $firebaseAuth(ref);

    $ionicModal.fromTemplateUrl("templates/common/forgotPasswordModal.html", {
        scope: $scope
    }).then(function (forgotPasswordModal) {
        $scope.forgotPasswordModal = forgotPasswordModal;
    });
    
    //Register user
        $ionicModal.fromTemplateUrl("templates/common/registerUserModal.html", {
            scope: $scope
        }).then(function (registerUserModal) {
            $scope.registerUserModal = registerUserModal;
        });
        //For dropdown list items
        $scope.roles = [
            {types:'student'},
            {types:'leader'},
            {types:'lecturer'}
        ];
        $scope.Role = $scope.roles[0]; // student
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
        $scope.showDoneBtn = false;
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

                        if(value!=null){
                            $scope.showDoneBtn =true;
                        }

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
            ref.child("users").child($rootScope.userId).child("classSchedule").once("value", function(snapshot){
                var value = snapshot.val();

                var counter = 0;
                //key is the left. value[key] is the right side of the object
                for (var key in value) {
                    if (value.hasOwnProperty(key)) {
                        counter++;
                    }
                }

                if(counter > 1 ) {
                    ref.child("users").child($rootScope.userId).child("classSchedule").child($scope.classItem.key).remove();
                    console.log($scope.classItem.Key + " deleted");
                } else if (counter <= 1) {
                    // An alert dialog
                    var alertPopup = $ionicPopup.alert({
                        title: 'Error',
                        template: 'You have to have at least 1 class schedule'
                    });
                    alertPopup.then(function(res) {
                        
                    });
                    console.log("\t counter: "+counter);
                }
                
                $scope.getClassTimetable($rootScope.userId);
                $scope.classItemOptionModal.hide();
            });
            
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
                    groupTask: group.taskName,
                    groupTaskDescription: group.taskDescription,
                    groupTaskGuideline: group.taskGuideline,
                    groupVenue: group.venue,
                    groupNoOfMembers: 1,
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
            ref.child("groups").child($rootScope.groupId).on("child_changed", function(snapshot){
                var value = snapshot.val()
                if(value.groupStatus == "active"){
                    if($rootScope.role == "student") {
                        $state.go('student-tab.timeline');
                    } else if ($rootScope.role == "leader") {
                        $state.go('leader-tab.timeline');
                    }
                }
            });

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
                groupStartDate: Firebase.ServerValue.TIMESTAMP,
                groupMembers: {
                    members: $scope.members
                }
            });
            $state.go('leader-tab.timeline');
        }

        $scope.initialise();
    }
})

.controller("ViewGroupListCtrl", function ($scope, $rootScope, $state, $ionicPopup, $ionicModal) {
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
        
        //groupMemberListModal
        $ionicModal.fromTemplateUrl('templates/student/groupMemberListModal.html', {
            scope: $scope
        }).then(function (groupMemberListModal) {
            $scope.groupMemberListModal = groupMemberListModal;
        });


        $scope.studentViewClassSchedule = function(){
            $state.go('studentViewClassSchedule')
        }

        $scope.joinGroup = function(){
            $scope.groupMemberListModal.hide();
            var item = $rootScope.groupInfo;
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
                    $scope.groupJoin(item,value);
                }
            });
        }

        $scope.groupJoin = function(item,noOfMembers){
            ref.child("users").child($rootScope.userId).update({
                groupId: item.key
            });
            ref.child("groups").child(item.key).update({
                groupNoOfMembers: noOfMembers+1,
            });
            $rootScope.groupId = item.key;
            $state.go('student-viewGroupMemberList');
        }

        $scope.viewGroupInfo = function (item){
            $scope.groupMemberList = [];
            ref.child("users").orderByChild("groupId").on("child_added", function (snapshot) {
                var value = snapshot.val();
                if(value.groupId == item.key){
                    value.key = String(snapshot.key());
                    $scope.groupMemberList.push(value);
                }
            });
            $rootScope.groupInfo = item;
            
            $scope.groupMemberListModal.show();
        }
    }
})

.controller("TimelineController", function ($scope, $rootScope, $state, $ionicPopup, $ionicLoading) {
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

        $scope.initialMondayList = [];
        $scope.initialTuesdayList = [];
        $scope.initialWednesdayList = [];
        $scope.initialThursdayList = [];
        $scope.initialFridayList = [];

        for (var i = 8; i < 19; i++){
            $scope.initialMondayList.push({
                time: i,
                day: "Monday",
                showMyself: false,
                sprintPlanningMondayCount: {
                    counter: 0,
                    me: ""
                },
                scrumPlanningMonday1Count: {
                    counter: 0,
                    me: ""
                },
                scrumPlanningMonday2Count: {
                    counter: 0,
                    me: ""
                },
                sprintReviewMondayCount: {
                    counter: 0,
                    me: ""
                },
                sprintRetrospectiveMondayCount: {
                    counter: 0,
                    me: ""
                }
            });
            $scope.initialTuesdayList.push({
                time: i,
                day: "Tuesday",
                showMyself: false,
                sprintPlanningTuesdayCount: {
                    counter: 0,
                    me: ""
                },
                scrumPlanningTuesday1Count: {
                    counter: 0,
                    me: ""
                },
                scrumPlanningTuesday2Count: {
                        counter: 0,
                        me: ""
                    },
                    sprintReviewTuesdayCount: {
                        counter: 0,
                        me: ""
                    },
                    sprintRetrospectiveTuesdayCount: {
                        counter: 0,
                        me: ""
                    }
                });
                $scope.initialWednesdayList.push({
                    time: i,
                    day: "Wednesday",
                    showMyself: false,
                    sprintPlanningWednesdayCount: {
                        counter: 0,
                        me: ""
                    },
                    scrumPlanningWednesday1Count: {
                        counter: 0,
                        me: ""
                    },
                    scrumPlanningWednesday2Count: {
                        counter: 0,
                        me: ""
                    },
                    sprintReviewWednesdayCount: {
                        counter: 0,
                        me: ""
                    },
                    sprintRetrospectiveWednesdayCount: {
                        counter: 0,
                        me: ""
                    }
                });
                $scope.initialThursdayList.push({
                    time: i,
                    day: "Thursday",
                    showMyself: false,
                    sprintPlanningThursdayCount: {
                        counter: 0,
                        me: ""
                    },
                    scrumPlanningThursday1Count: {
                        counter: 0,
                        me: ""
                    },
                    scrumPlanningThursday2Count: {
                        counter: 0,
                        me: ""
                    },
                    sprintReviewThursdayCount: {
                        counter: 0,
                        me: ""
                    },
                    sprintRetrospectiveThursdayCount: {
                        counter: 0,
                        me: ""
                    }
                });
                $scope.initialFridayList.push({
                    time: i,
                    day: "Friday",
                    showMyself: false,
                    sprintPlanningFridayCount: {
                        counter: 0,
                        me: ""
                    },
                    scrumPlanningFriday1Count: {
                        counter: 0,
                        me: ""
                    },
                    scrumPlanningFriday2Count: {
                        counter: 0,
                        me: ""
                    },
                    sprintReviewFridayCount: {
                        counter: 0,
                        me: ""
                    },
                    sprintRetrospectiveFridayCount: {
                        counter: 0,
                        me: ""
                    }
                });
            }

        $scope.initialise = function (){
            $scope.mondayList = angular.copy($scope.initialMondayList);
            $scope.tuesdayList = angular.copy($scope.initialTuesdayList);
            $scope.wednesdayList = angular.copy($scope.initialWednesdayList);
            $scope.thursdayList = angular.copy($scope.initialThursdayList);
            $scope.fridayList = angular.copy($scope.initialFridayList);
            
            var userList = [];
            $scope.showSprintPlanningList = false;
            $scope.showScrumPlanningList1 = false;
            $scope.showScrumPlanningList2 = false;
            $scope.showSprintReviewList = false;
            $scope.showSprintRetrospectiveList = false;

            $scope.showConfirmedSprintPlanningTime = false;
            $scope.showConfirmedScrumPlanningTime1 = false;
            $scope.showConfirmedScrumPlanningTime2 = false;
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
            $scope.toShowScrumPlanning1 = "";
            $scope.toShowScrumPlanning2 = "";
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
            var serverTime = new Date(getServerTime()); 
            console.log("servertime: "+getServerTime());

            ref.child("groups").child($rootScope.groupId).child("groupStartDate").once("value", function(snapshot) {
                //value = group start date
                var value = snapshot.val();

                console.log("ori date: "+new Date(value));

                //plus 7 dayy = 604800000, plus 1 day = 86400000
                var sDate = new Date(value+604800000+(86400000*0));
                
                var counter = 0;
                while(sDate.getDay()!=1){
                    counter++;
                    sDate = new Date(value+604800000+(86400000*counter));
                }
                console.log("counter: "+counter+" - sure? "+new Date(value+604800000+(86400000*counter)));
                $scope.setDates(value,counter);
            });

            ref.child("groups").child($rootScope.groupId).child("groupNoOfMembers").once("value", function(snapshot){
                var value = snapshot.val();
                $scope.numberOfGroupMembers = value;
            });

            $scope.getGroupMembersId($rootScope.groupId);
            $scope.getConfirmedTime($rootScope.groupId);
        }

        $scope.setDates = function(initialDateInUtc,counter) {
            // console.log("Sprint Planning first date: "+Date(initialDateInUtc).getDate()+"/"+(Date(initialDateInUtc).getMonth()+1)+"/"+Date(initialDateInUtc).getUTCFullYear()+" == Day: "+Date(initialDateInUtc).getDay());
            
            var initialDate = new Date(initialDateInUtc+604800000+(86400000*counter));
            $scope.sprintPlanningMondayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+1)));
            $scope.sprintPlanningTuesdayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+2)));
            $scope.sprintPlanningWednesdayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+3)));
            $scope.sprintPlanningThursdayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+4)));
            $scope.sprintPlanningFridayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();

            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+7)));
            $scope.scrumPlanningMondayDate1 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+8)));
            $scope.scrumPlanningTuesdayDate1 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+9)));
            $scope.scrumPlanningWednesdayDate1 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+10)));
            $scope.scrumPlanningThursdayDate1 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+11)));
            $scope.scrumPlanningFridayDate1 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();

            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+14)));
            $scope.scrumPlanningMondayDate2 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+15)));
            $scope.scrumPlanningTuesdayDate2 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+16)));
            $scope.scrumPlanningWednesdayDate2 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+17)));
            $scope.scrumPlanningThursdayDate2 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+18)));
            $scope.scrumPlanningFridayDate2 = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();

            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+21)));
            $scope.sprintReviewMondayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+22)));
            $scope.sprintReviewTuesdayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+23)));
            $scope.sprintReviewWednesdayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+24)));
            $scope.sprintReviewThursdayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+25)));
            $scope.sprintReviewFridayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();

            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+28)));
            $scope.sprintRetrospectiveMondayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+29)));
            $scope.sprintRetrospectiveTuesdayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+30)));
            $scope.sprintRetrospectiveWednesdayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+31)));
            $scope.sprintRetrospectiveThursdayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
            initialDate = new Date(initialDateInUtc+604800000+(86400000*(counter+32)));
            $scope.sprintRetrospectiveFridayDate = initialDate.getDate()+" / "+(initialDate.getMonth()+1)+" / "+initialDate.getUTCFullYear();
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
                    $scope.groupStartDate = new Date(value);
                }
            });

            console.log("startDate: "+$scope.groupStartDate);

            //Get sprint planning confirmed date time
            ref.child("groups").child(groupId).child("confirmedSprintPlanningDateTime").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.toShowSprintPlanning = "showSprintPlanningList";
                    $scope.getSprintPlanningInfo();
                } else {
                    $ionicLoading.hide();
                    $scope.toShowSprintPlanning = "showConfirmedSprintPlanningTime";
                    $scope.confirmedSprintPlanningDate = value.confirmedDate;
                    $scope.confirmedSprintPlanningDay = value.confirmedDay;
                    $scope.confirmedSprintPlanningTime = value.confirmedTime;
                }
            });

            //Get sprint planning confirmed date time week 1
            ref.child("groups").child(groupId).child("confirmedScrumPlanningDateTime1").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.toShowScrumPlanning1 = "showScrumPlanningList1";
                    $scope.getScrumPlanningInfo1();
                } else {
                    $ionicLoading.hide();
                    $scope.toShowScrumPlanning1 = "showConfirmedScrumPlanningTime1";
                    $scope.confirmedScrumPlanningDate1 = value.confirmedDate;
                    $scope.confirmedScrumPlanningDay1 = value.confirmedDay;
                    $scope.confirmedScrumPlanningTime1 = value.confirmedTime;
                }
            });

            //Get sprint planning confirmed date time week 2
            ref.child("groups").child(groupId).child("confirmedScrumPlanningDateTime2").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.toShowScrumPlanning2 = "showScrumPlanningList2";
                    $scope.getScrumPlanningInfo2();
                } else {
                    $ionicLoading.hide();
                    $scope.toShowScrumPlanning2 = "showConfirmedScrumPlanningTime2";
                    $scope.confirmedScrumPlanningDate2 = value.confirmedDate;
                    $scope.confirmedScrumPlanningDay2 = value.confirmedDay;
                    $scope.confirmedScrumPlanningTime2 = value.confirmedTime;
                }
            });

            //Get sprint planning confirmed date time
            ref.child("groups").child(groupId).child("confirmedSprintReviewDateTime").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.toShowSprintReview = "showSprintReviewList";
                    $scope.getSprintReviewInfo();
                } else {
                    $ionicLoading.hide();
                    $scope.toShowSprintReview = "showConfirmedSprintReviewTime";
                    $scope.confirmedSprintReviewDate = value.confirmedDate;
                    $scope.confirmedSprintReviewDay = value.confirmedDay;
                    $scope.confirmedSprintReviewTime = value.confirmedTime;
                }
            });

            //Get sprint planning confirmed date time
            ref.child("groups").child(groupId).child("confirmedSprintRetrospectiveDateTime").once('value', function (snapshot) {
                var value = snapshot.val();
                if(value == null){
                    $scope.toShowSprintRetrospective = "showSprintRetrospectiveList";
                    $scope.getSprintRetrospectiveInfo();
                } else {
                    $ionicLoading.hide();
                    $scope.toShowSprintRetrospective = "showConfirmedSprintRetrospectiveTime";
                    $scope.confirmedSprintRetrospectiveDate = value.confirmedDate;
                    $scope.confirmedSprintRetrospectiveDay = value.confirmedDay;
                    $scope.confirmedSprintRetrospectiveTime = value.confirmedTime;
                }
            });
        }

        $scope.getUsersTimetable = function (userKey) {
            ref.child("users").child(userKey).child("classSchedule").orderByChild("classDay").on("child_added", function (snapshot) {
                var value = snapshot.val();
                var dayOfClass = value.classDay;
                
                var classStartTimeHourArray = value.classStartTime.substring(0, 2);
                var classStartTimeHour = parseInt(classStartTimeHourArray);

                var classEndTimeHourArray = value.classEndTime.substring(0, 2);
                if(classEndTimeHourArray!="00"){
                    var classEndTimeHour = Math.ceil(parseInt(classEndTimeHourArray))+1;
                } else {
                    var classEndTimeHour = Math.ceil(parseInt(classEndTimeHourArray))-1;
                }
                 
                var totalHours = classEndTimeHour - classStartTimeHour;
                
                switch(dayOfClass){
                    case "Friday":{
                        if(totalHours > 0){
                            var i = 0;
                            var size = $scope.fridayList.length;
                            for (i=0;i<size;i++){
                                if($scope.fridayList[i].time == classStartTimeHour){
                                    $scope.fridayList.splice(i, totalHours);
                                    break;
                                }
                            }
                        }
                    }
                    break;
                    case "Monday":{
                        if(totalHours > 0){
                            var i = 0;
                            var size = $scope.mondayList.length;
                            for (i=0;i<size;i++){
                                if($scope.mondayList[i].time == classStartTimeHour){
                                    $scope.mondayList.splice(i, totalHours);
                                    break;
                                }
                            }
                        }
                    }
                    break;
                    case "Tuesday":{
                        if(totalHours > 0){
                            var i = 0;
                            var size = $scope.tuesdayList.length;
                            for (i=0;i<size;i++){
                                if($scope.tuesdayList[i].time == classStartTimeHour){
                                    $scope.tuesdayList.splice(i, totalHours);
                                    break;
                                }
                            }
                        }
                    }
                    break;
                    case "Thursday":{
                        if(totalHours > 0){
                            var i = 0;
                            var size = $scope.thursdayList.length;
                            for (i=0;i<size;i++){
                                if($scope.thursdayList[i].time == classStartTimeHour){
                                    $scope.thursdayList.splice(i, totalHours);
                                    break;
                                }
                            }
                        }
                    }
                    break;
                    case "Wednesday":{
                        if(totalHours > 0){
                            var i = 0;
                            var size = $scope.wednesdayList.length;
                            for (i=0;i<size;i++){
                                if($scope.wednesdayList[i].time == classStartTimeHour){
                                    $scope.wednesdayList.splice(i, totalHours);
                                    break;
                                }
                            }
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

        $scope.showScrumPlanning1 = function () {
            if ($scope.showScrumPlanningList1||$scope.showConfirmedScrumPlanningTime1){
                $scope.showScrumPlanningList1=false;
                $scope.showConfirmedScrumPlanningTime1 = false;
            } else {
                if($scope.toShowScrumPlanning1 == "showScrumPlanningList1"){
                    $scope.showScrumPlanningList1 = true;
                    $scope.showConfirmedScrumPlanningTime1 = false;
                } else if ($scope.toShowScrumPlanning1 == "showConfirmedScrumPlanningTime1"){
                    $scope.showScrumPlanningList1=false;
                    $scope.showConfirmedScrumPlanningTime1 = true;
                }
            }
        }

        $scope.showScrumPlanning2 = function () {
            if ($scope.showScrumPlanningList2||$scope.showConfirmedScrumPlanningTime2){
                $scope.showScrumPlanningList2=false;
                $scope.showConfirmedScrumPlanningTime2 = false;
            } else {
                if($scope.toShowScrumPlanning2 == "showScrumPlanningList2"){
                    $scope.showScrumPlanningList2 = true;
                    $scope.showConfirmedScrumPlanningTime2 = false;
                } else if ($scope.toShowScrumPlanning2 == "showConfirmedScrumPlanningTime2"){
                    $scope.showScrumPlanningList2=false;
                    $scope.showConfirmedScrumPlanningTime2 = true;
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

        //Sprint planning info
        $scope.getSprintPlanningInfo = function() {
            // Get the data on a post that has changed
            ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").on("child_changed", function(snapshot) {
                var value = snapshot.val();
                console.log("The vote count for sprintplanning is " + value.count);
                if(value.count == $scope.numberOfGroupMembers){
                    $scope.initialise();
                }
            });

            ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").once("value",function(snapshot){
                var value = snapshot.val();
                console.log("value: "+value);

                //key is the left. value[key] is the right side of the object
                for (var key in value) {
                    if (value.hasOwnProperty(key)) {
                    
                        if(key!="count"){
                            var object = value[key];

                            var votedDay = object.day;
                            var voteTime = parseInt(object.voteTime);

                            if (votedDay == "Monday"){
                                for (var inList in $scope.mondayList) {
                                    console.log("\t inList: "+inList);
                                    if($scope.mondayList[inList].time == voteTime){
                                        if(object.userId == $rootScope.userId){
                                            $scope.mondayList[inList].sprintPlanningMondayCount.me = "ME";
                                            $scope.mySprintPlanningVoteId = key;
                                        }
                                        $scope.mondayList[inList].sprintPlanningMondayCount.counter += 1;
                                        
                                        $scope.mondayList[inList].showMyself = true;
                                    }
                                }
                            } else if (votedDay == "Tuesday"){
                                for (var inList in $scope.tuesdayList) {
                                    console.log("\t inList: "+inList);
                                    if($scope.tuesdayList[inList].time == voteTime){
                                        if(object.userId == $rootScope.userId){
                                            $scope.tuesdayList[inList].sprintPlanningTuesdayCount.me = "ME";
                                            $scope.mySprintPlanningVoteId = key;
                                        }
                                        $scope.tuesdayList[inList].sprintPlanningTuesdayCount.counter += 1;
                                        
                                        $scope.tuesdayList[inList].showMyself = true;
                                    }
                                }
                            } else if (votedDay == "Wednesday"){
                                for (var inList in $scope.wednesdayList) {
                                    console.log("\t inList: "+inList);
                                    if($scope.wednesdayList[inList].time == voteTime){
                                        if(object.userId == $rootScope.userId){
                                            $scope.wednesdayList[inList].sprintPlanningWednesdayCount.me = "ME";
                                            $scope.mySprintPlanningVoteId = key;
                                        }
                                        $scope.wednesdayList[inList].sprintPlanningWednesdayCount.counter += 1;
                                        
                                        $scope.wednesdayList[inList].showMyself = true;
                                    }
                                }
                            } else if (votedDay == "Thursday") {
                                for (var inList in $scope.thursdayList) {
                                    console.log("\t inList: "+inList);
                                    if($scope.thursdayList[inList].time == voteTime){
                                        if(object.userId == $rootScope.userId){
                                            $scope.thursdayList[inList].sprintPlanningThursdayCount.me = "ME";
                                            $scope.mySprintPlanningVoteId = key;
                                        }
                                        $scope.thursdayList[inList].sprintPlanningThursdayCount.counter += 1;
                                        
                                        $scope.thursdayList[inList].showMyself = true;
                                    }
                                }
                            } else if (votedDay == "Friday") {
                                for (var inList in $scope.fridayList) {
                                    console.log("\t inList: "+inList);
                                    if($scope.fridayList[inList].time == voteTime){
                                        if(object.userId == $rootScope.userId){
                                            $scope.fridayList[inList].sprintPlanningFridayCount.me = "ME";
                                            $scope.mySprintPlanningVoteId = key;
                                        }
                                        $scope.fridayList[inList].sprintPlanningFridayCount.counter += 1;
                                        
                                        $scope.fridayList[inList].showMyself = true;
                                    }
                                }
                            } else {
                                console.log ("err, error?: "+votedDay);
                            }
                        } else {
                            if(parseInt(value[key])==$scope.numberOfGroupMembers){
                                $scope.setConfirmedDateTime("voteSprintPlanning");
                            }
                        }
                    }
                }
                $ionicLoading.hide();
            });
        }

        //Scrum Planning 1 info 
        $scope.getScrumPlanningInfo1 = function() {
            // Get the data on a post that has changed
            ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").on("child_changed", function(snapshot) {
                var value = snapshot.val();
                console.log("The vote count for voteScrumPlanning1 is " + value.count);
                if(value.count==$scope.numberOfGroupMembers){
                    $scope.initialise();
                }
            });

            ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").once("value",function(snapshot){
                var value = snapshot.val();
                console.log("value: "+value);

                //key is the left. value[key] is the right side of the object
                for (var key in value) {
                  if (value.hasOwnProperty(key)) {
                    
                    if(key!="count"){
                        var object = value[key];

                        var votedDay = object.day;
                        var voteTime = parseInt(object.voteTime);

                        if (votedDay == "Monday"){
                            for (var inList in $scope.mondayList) {
                                console.log("\t inList: "+inList);
                                if($scope.mondayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.mondayList[inList].scrumPlanningMonday1Count.me = "ME";
                                        $scope.myScrumPlanningVoteId1 = key;
                                    }
                                    $scope.mondayList[inList].scrumPlanningMonday1Count.counter += 1;
                                    
                                    $scope.mondayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Tuesday"){
                            for (var inList in $scope.tuesdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.tuesdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.tuesdayList[inList].scrumPlanningTuesday1Count.me = "ME";
                                        $scope.myScrumPlanningVoteId1 = key;
                                    }
                                    $scope.tuesdayList[inList].scrumPlanningTuesday1Count.counter += 1;
                                    
                                    $scope.tuesdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Wednesday"){
                            for (var inList in $scope.wednesdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.wednesdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.wednesdayList[inList].scrumPlanningWednesday1Count.me = "ME";
                                        $scope.myScrumPlanningVoteId1 = key;
                                    }
                                    $scope.wednesdayList[inList].scrumPlanningWednesday1Count.counter += 1;
                                    
                                    $scope.wednesdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Thursday") {
                            for (var inList in $scope.thursdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.thursdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.thursdayList[inList].scrumPlanningThursday1Count.me = "ME";
                                        $scope.myScrumPlanningVoteId1 = key;
                                    }
                                    $scope.thursdayList[inList].scrumPlanningThursday1Count.counter += 1;
                                    
                                    $scope.thursdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Friday") {
                            for (var inList in $scope.fridayList) {
                                console.log("\t inList: "+inList);
                                if($scope.fridayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.fridayList[inList].scrumPlanningFriday1Count.me = "ME";
                                        $scope.myScrumPlanningVoteId1 = key;
                                    }
                                    $scope.fridayList[inList].scrumPlanningFriday1Count.counter += 1;
                                    
                                    $scope.fridayList[inList].showMyself = true;
                                }
                            }
                        } else {
                            console.log ("err, error?: "+votedDay);
                        }
                    } else {
                        if(parseInt(value[key])==$scope.numberOfGroupMembers){
                            $scope.setConfirmedDateTime("voteScrumPlanning1");
                        }
                    }
                  }
                }
                $ionicLoading.hide();
            });
        }

        //Scrum Planning info 2 
        $scope.getScrumPlanningInfo2 = function() {
            // Get the data on a post that has changed
            ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").on("child_changed", function(snapshot) {
                var value = snapshot.val();
                console.log("The vote count for voteScrumPlanning2 is " + value.count);
                if(value.count==$scope.numberOfGroupMembers){
                    $scope.initialise();
                }
            });

            ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").once("value",function(snapshot){
                var value = snapshot.val();
                console.log("value: "+value);

                //key is the left. value[key] is the right side of the object
                for (var key in value) {
                  if (value.hasOwnProperty(key)) {
                    
                    if(key!="count"){
                        var object = value[key];

                        var votedDay = object.day;
                        var voteTime = parseInt(object.voteTime);

                        if (votedDay == "Monday"){
                            for (var inList in $scope.mondayList) {
                                console.log("\t inList: "+inList);
                                if($scope.mondayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.mondayList[inList].scrumPlanningMonday2Count.me = "ME";
                                        $scope.myScrumPlanningVoteId2 = key;
                                    }
                                    $scope.mondayList[inList].scrumPlanningMonday2Count.counter += 1;
                                    
                                    $scope.mondayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Tuesday"){
                            for (var inList in $scope.tuesdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.tuesdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.tuesdayList[inList].scrumPlanningTuesday2Count.me = "ME";
                                        $scope.myScrumPlanningVoteId2 = key;
                                    }
                                    $scope.tuesdayList[inList].scrumPlanningTuesday2Count.counter += 1;
                                    
                                    $scope.tuesdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Wednesday"){
                            for (var inList in $scope.wednesdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.wednesdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.wednesdayList[inList].scrumPlanningWednesday2Count.me = "ME";
                                        $scope.myScrumPlanningVoteId2 = key;
                                    }
                                    $scope.wednesdayList[inList].scrumPlanningWednesday2Count.counter += 1;
                                    
                                    $scope.wednesdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Thursday") {
                            for (var inList in $scope.thursdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.thursdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.thursdayList[inList].scrumPlanningThursday2Count.me = "ME";
                                        $scope.myScrumPlanningVoteId2 = key;
                                    }
                                    $scope.thursdayList[inList].scrumPlanningThursday2Count.counter += 1;
                                    
                                    $scope.thursdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Friday") {
                            for (var inList in $scope.fridayList) {
                                console.log("\t inList: "+inList);
                                if($scope.fridayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.fridayList[inList].scrumPlanningFriday2Count.me = "ME";
                                        $scope.myScrumPlanningVoteId2 = key;
                                    }
                                    $scope.fridayList[inList].scrumPlanningFriday2Count.counter += 1;
                                    
                                    $scope.fridayList[inList].showMyself = true;
                                }
                            }
                        } else {
                            console.log ("err, error?: "+votedDay);
                        }
                    } else {
                        if(parseInt(value[key])==$scope.numberOfGroupMembers){
                            $scope.setConfirmedDateTime("voteScrumPlanning2");
                        }
                    }
                  }
                }
                $ionicLoading.hide();
            });
        }

        //Get sprint retrospective info
        $scope.getSprintRetrospectiveInfo = function() {
            // Get the data on a post that has changed
            ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").on("child_changed", function(snapshot) {
                var value = snapshot.val();
                console.log("The vote count for voteSprintRetrospective is " + value.count);
                if(value.count==$scope.numberOfGroupMembers){
                    $scope.initialise();
                }
            });

            ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").once("value",function(snapshot){
                var value = snapshot.val();
                console.log("value: "+value);

                //key is the left. value[key] is the right side of the object
                for (var key in value) {
                  if (value.hasOwnProperty(key)) {
                    
                    if(key!="count"){
                        var object = value[key];

                        var votedDay = object.day;
                        var voteTime = parseInt(object.voteTime);

                        if (votedDay == "Monday"){
                            for (var inList in $scope.mondayList) {
                                console.log("\t inList: "+inList);
                                if($scope.mondayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.mondayList[inList].sprintRetrospectiveMondayCount.me = "ME";
                                        $scope.mySprintRetrospectiveVoteId = key;
                                    }
                                    $scope.mondayList[inList].sprintRetrospectiveMondayCount.counter += 1;
                                    
                                    $scope.mondayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Tuesday"){
                            for (var inList in $scope.tuesdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.tuesdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.tuesdayList[inList].sprintRetrospectiveTuesdayCount.me = "ME";
                                        $scope.mySprintRetrospectiveVoteId = key;
                                    }
                                    $scope.tuesdayList[inList].sprintRetrospectiveTuesdayCount.counter += 1;
                                    
                                    $scope.tuesdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Wednesday"){
                            for (var inList in $scope.wednesdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.wednesdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.wednesdayList[inList].sprintRetrospectiveWednesdayCount.me = "ME";
                                        $scope.mySprintRetrospectiveVoteId = key;
                                    }
                                    $scope.wednesdayList[inList].sprintRetrospectiveWednesdayCount.counter += 1;
                                    
                                    $scope.wednesdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Thursday") {
                            for (var inList in $scope.thursdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.thursdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.thursdayList[inList].sprintRetrospectiveThursdayCount.me = "ME";
                                        $scope.mySprintRetrospectiveVoteId = key;
                                    }
                                    $scope.thursdayList[inList].sprintRetrospectiveThursdayCount.counter += 1;
                                    
                                    $scope.thursdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Friday") {
                            for (var inList in $scope.fridayList) {
                                console.log("\t inList: "+inList);
                                if($scope.fridayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.fridayList[inList].sprintRetrospectiveFridayCount.me = "ME";
                                        $scope.mySprintRetrospectiveVoteId = key;
                                    }
                                    $scope.fridayList[inList].sprintRetrospectiveFridayCount.counter += 1;
                                    
                                    $scope.fridayList[inList].showMyself = true;
                                }
                            }
                        } else {
                            console.log ("err, error?: "+votedDay);
                        }
                    } else {
                        if(parseInt(value[key])==$scope.numberOfGroupMembers){
                            $scope.setConfirmedDateTime("voteSprintRetrospective");
                        }
                    }
                  }
                }
                $ionicLoading.hide();
            });
        }

        //Get sprint review info
        $scope.getSprintReviewInfo = function() {
            // Get the data on a post that has changed
            ref.child("groups").child($rootScope.groupId).child("voteSprintReview").on("child_changed", function(snapshot) {
                var value = snapshot.val();
                console.log("The vote count for voteSprintReview is " + value.count);
                if(value.count==$scope.numberOfGroupMembers){
                    $scope.initialise();
                }
            });

            ref.child("groups").child($rootScope.groupId).child("voteSprintReview").once("value",function(snapshot){
                var value = snapshot.val();
                console.log("value: "+value);

                //key is the left. value[key] is the right side of the object
                for (var key in value) {
                  if (value.hasOwnProperty(key)) {
                    
                    if(key!="count"){
                        var object = value[key];

                        var votedDay = object.day;
                        var voteTime = parseInt(object.voteTime);

                        if (votedDay == "Monday"){
                            for (var inList in $scope.mondayList) {
                                console.log("\t inList: "+inList);
                                if($scope.mondayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.mondayList[inList].sprintReviewMondayCount.me = "ME";
                                        $scope.mySprintReviewVoteId = key;
                                    }
                                    $scope.mondayList[inList].sprintReviewMondayCount.counter += 1;
                                    
                                    $scope.mondayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Tuesday"){
                            for (var inList in $scope.tuesdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.tuesdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.tuesdayList[inList].sprintReviewTuesdayCount.me = "ME";
                                        $scope.mySprintReviewVoteId = key;
                                    }
                                    $scope.tuesdayList[inList].sprintReviewTuesdayCount.counter += 1;
                                    
                                    $scope.tuesdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Wednesday"){
                            for (var inList in $scope.wednesdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.wednesdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.wednesdayList[inList].sprintReviewWednesdayCount.me = "ME";
                                        $scope.mySprintReviewVoteId = key;
                                    }
                                    $scope.wednesdayList[inList].sprintReviewWednesdayCount.counter += 1;
                                    
                                    $scope.wednesdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Thursday") {
                            for (var inList in $scope.thursdayList) {
                                console.log("\t inList: "+inList);
                                if($scope.thursdayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.thursdayList[inList].sprintReviewThursdayCount.me = "ME";
                                        $scope.mySprintReviewVoteId = key;
                                    }
                                    $scope.thursdayList[inList].sprintReviewThursdayCount.counter += 1;
                                    
                                    $scope.thursdayList[inList].showMyself = true;
                                }
                            }
                        } else if (votedDay == "Friday") {
                            for (var inList in $scope.fridayList) {
                                console.log("\t inList: "+inList);
                                if($scope.fridayList[inList].time == voteTime){
                                    if(object.userId == $rootScope.userId){
                                        $scope.fridayList[inList].sprintReviewFridayCount.me = "ME";
                                        $scope.mySprintReviewVoteId = key;
                                    }
                                    $scope.fridayList[inList].sprintReviewFridayCount.counter += 1;
                                    
                                    $scope.fridayList[inList].showMyself = true;
                                }
                            }
                        } else {
                            console.log ("err, error?: "+votedDay);
                        }
                    } else {
                        if(parseInt(value[key])==$scope.numberOfGroupMembers){
                            $scope.setConfirmedDateTime("voteSprintReview");
                        }
                    }
                  }
                }
                $ionicLoading.hide();
            });
        }
        
        //Sprint Planning selection
        $scope.selectDateTimeSprintPlanning = function(time, day, date) {
            $ionicLoading.show({
                template: 'Loading...'
            });
            
            console.log("wtf?");
            
            ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").child("count").once('value', function (snapshot) {
                var numberOfVotes = snapshot.val();
                console.log("wtf here?");

                if(numberOfVotes==null){
                    console.log("wtf? null");

                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.sprintPlanningVote(time,day, 1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").child("count").set(1, onComplete);
                } else if (numberOfVotes==$scope.numberOfGroupMembers) {
                    $scope.initialise();
                } else if (numberOfVotes>0 && numberOfVotes<$scope.numberOfGroupMembers) {
                    console.log("wtf? 0..."+$scope.numberOfGroupMembers);
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.sprintPlanningVote(time,day, numberOfVotes+1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").child("count").set(numberOfVotes+1, onComplete);
                }  else {
                    console.log("wtf? seriously?");
                }
            });
        }

        $scope.sprintPlanningVote = function(time,day, number, date){
            if(number == $scope.numberOfGroupMembers){
                var done = function(){
                    $scope.setConfirmedDateTime("voteSprintPlanning");
                };

                ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").push({
                        date: date,
                        day: day,
                        voteTime: time,
                        userId : $rootScope.userId
                    }, 
                    function() { 
                        $scope.initialise();
                },done);
            } else if (number>0 && number<$scope.numberOfGroupMembers){
                if($scope.mySprintPlanningVoteId == "" || $scope.mySprintPlanningVoteId == null){
                    console.log("\t\t mySprintPlanningVoteId: "+$scope.mySprintPlanningVoteId);
                    ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").push({
                            date: date,
                            day: day,
                            voteTime: time,
                            userId : $rootScope.userId
                        }, 
                        function() { 
                            $scope.initialise();
                    });
                } else {
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").child("count").once('value', function (snapshot) {
                                var numberOfVotes = snapshot.val();
                                if (numberOfVotes>0) {
                                    var onComplete = function(error) {
                                        if (error) {
                                            console.log('Synchronization failed');
                                        } else {
                                            console.log('Synchronization succeeded');
                                            ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").push({
                                                    date: date,
                                                    day: day,
                                                    voteTime: time,
                                                    userId : $rootScope.userId
                                                }, 
                                                function() { 
                                                    $scope.initialise();
                                            });
                                        }
                                    };
                                    ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").child("count").set(numberOfVotes-1, onComplete);
                                }
                            });
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteSprintPlanning").child($scope.mySprintPlanningVoteId).remove(onComplete);
                }
            } else {
                console.log("Number is wrong!");
            }
        }

        $scope.setConfirmedDateTime = function (voteName){
            ref.child("groups").child($rootScope.groupId).child(voteName).once("value", function(snapshot){
                var value = snapshot.val();

                var objectCounterArray = [];
                var objectArray = [];
                var moreThanOne = false;
                //key is the left. value[key] is the right side of the object
                for (var key in value) {
                    if (value.hasOwnProperty(key)) {
                        // console.log("~~~ Looping here: "+value[key]);
                        // console.log("~~~ Looping here 1: "+key);
                        if(key!="count"){
                            var object = value[key];

                            var newObject = {
                                votedDate: object.date,
                                votedDay: object.day,
                                votedTime: object.voteTime
                            }

                            // console.log("~~~ Looping here 2: "+object.date);
                            // console.log("~~~ Looping here 3: "+object.day);
                            // console.log("~~~ Looping here 4: "+object.voteTime);

                            // console.log("~~~ Looping here 2 newObject votedDate: "+newObject.votedDate);
                            // console.log("~~~ Looping here 3 newObject votedDay: "+newObject.votedDay);
                            // console.log("~~~ Looping here 4 newObject votedTime: "+newObject.votedTime);

                            var arrayLength = objectArray.length;

                            if(arrayLength==0){
                                objectArray.push(newObject);
                                objectCounterArray.push(1);
                            } else if (arrayLength >0){
                                for(var i=0; i<arrayLength; i++){
                                    var objectAtIndex = objectArray[i];

                                    // console.log("objectAtIndex: "+objectAtIndex);
                                    // console.log("objectAtIndex.votedDate: "+objectAtIndex.votedDate);
                                    // console.log("objectAtIndex.votedDay: "+objectAtIndex.votedDay);
                                    // console.log("objectAtIndex.votedTime: "+objectAtIndex.votedTime);

                                    if(objectAtIndex.votedDate==newObject.votedDate &&
                                       objectAtIndex.votedDay==newObject.votedDay &&
                                       objectAtIndex.votedTime == newObject.votedTime) {
                                        // console.log("came in?");
                                        objectCounterArray[i]+=1;
                                        break;
                                    } else {
                                        if(i==arrayLength-1){
                                            // console.log("nahhhhhhhhhhh");
                                            objectArray.push(newObject);
                                            objectCounterArray.push(1);
                                        }
                                    }
                                }
                            }

                        } 

                    }
                }


                console.log("~~~~~~~~~~~~~~~~~~~~ objectCounterArray: "+objectCounterArray);
                var highestVoted = {
                    voteCount:0,
                    indexed:-1
                };

                for(var i=0, l=objectCounterArray.length; i<l; i++) {
                    if(highestVoted.voteCount==0){
                        highestVoted.voteCount = objectCounterArray[i];
                        highestVoted.indexed = i;
                    } else if (highestVoted.voteCount == objectCounterArray[i]) {
                        moreThanOne = true;
                        highestVoted.voteCount = objectCounterArray[i];
                        highestVoted.indexed = i;
                        break;
                    } else {
                        if(objectCounterArray[i] > highestVoted){
                            highestVoted.voteCount = objectCounterArray[i];
                            highestVoted.indexed = i;
                        }
                    }
                }

                var indexOfArrayWithMoreThanOne = [];
                if(moreThanOne) {
                    var highestVotedObjects = {
                        votedDate:"",
                        votedDay:"",
                        votedTime:0
                    };
                    for(var m=0, n=objectCounterArray.length; m<n; m++){
                        if(objectCounterArray[m] == highestVoted.voteCount){
                            indexOfArrayWithMoreThanOne.push(m);
                        }
                    }

                    for(var indexes in indexOfArrayWithMoreThanOne){
                        if(highestVotedObjects.votedTime==0){
                            highestVotedObjects.votedDate = objectArray[i].votedDate;
                            highestVotedObjects.votedDay = objectArray[i].votedDay;
                            highestVotedObjects.votedTime = objectArray[i].votedTime;
                        } else {
                            if(objectArray[i].votedDate != highestVotedObjects.votedDate){
                                var splitObjectDate = objectArray[i].votedDate.splt("/");
                                var splitHighDate = highestVotedObjects.votedDate.splt("/");

                                //[1] is month
                                if(Number(splitObjectDate[1].trim())>Number(highestVotedObjects[1].trim())){
                                    highestVotedObjects.votedDate = objectArray[i].votedDate;
                                    highestVotedObjects.votedDay = objectArray[i].votedDay;
                                    highestVotedObjects.votedTime = objectArray[i].votedTime;
                                } else if(Number(splitObjectDate[1].trim())==Number(highestVotedObjects[1].trim())){
                                    //[0] is day
                                    if(Number(splitObjectDate[0].trim())>Number(highestVotedObjects[0].trim())) {
                                        highestVotedObjects.votedDate = objectArray[i].votedDate;
                                        highestVotedObjects.votedDay = objectArray[i].votedDay;
                                        highestVotedObjects.votedTime = objectArray[i].votedTime;
                                    } else if (Number(splitObjectDate[0].trim())==Number(highestVotedObjects[0].trim())) {
                                        //Take the earliest voted time
                                        if(objectArray[i].votedTime < highestVotedObjects.votedTime) {
                                            highestVotedObjects.votedDate = objectArray[i].votedDate;
                                            highestVotedObjects.votedDay = objectArray[i].votedDay;
                                            highestVotedObjects.votedTime = objectArray[i].votedTime;
                                        } else if (objectArray[i].votedTime == highestVotedObjects.votedTime) {
                                            console.log("ERROR! Not suppose have same time! (Not equal date)");
                                        } // If time lower, ignore
                                    } //If date lower, ignore
                                } //If month lower, ignore
                            } else { //Date is equals
                                //Take the earliest voted time
                                if(objectArray[i].votedTime < highestVotedObjects.votedTime) {
                                    highestVotedObjects.votedDate = objectArray[i].votedDate;
                                    highestVotedObjects.votedDay = objectArray[i].votedDay;
                                    highestVotedObjects.votedTime = objectArray[i].votedTime;
                                } else if (objectArray[i].votedTime == highestVotedObjects.votedTime) {
                                    console.log("ERROR! Not suppose have same time! (Equal date)");
                                } // If time lower, ignore
                            }
                        }
                    }

                    $scope.storeConfirmedDateTime(highestVotedObjects, voteName);
                    
                } else {
                    $scope.storeConfirmedDateTime(objectArray[highestVoted.indexed], voteName);
                }
            });
        }

        $scope.storeConfirmedDateTime = function(highestVotedObject, voteName){
            var onComplete = function(error) {
                if (error) {
                    console.log('Synchronization failed for storeConfirmedDateTime');
                } else {
                    console.log('Synchronization succeeded for storeConfirmedDateTime');
                    $scope.initialise();
                }
            };

            if(voteName == "voteSprintPlanning"){
                        ref.child("groups").child($rootScope.groupId).child("confirmedSprintPlanningDateTime").set({
                            confirmedDate: highestVotedObject.votedDate,
                            confirmedDay: highestVotedObject.votedDay,
                            confirmedTime: highestVotedObject.votedTime
                        },onComplete);
                    } else if (voteName == "voteScrumPlanning1") {
                        ref.child("groups").child($rootScope.groupId).child("confirmedScrumPlanningDateTime1").set({
                            confirmedDate: highestVotedObject.votedDate,
                            confirmedDay: highestVotedObject.votedDay,
                            confirmedTime: highestVotedObject.votedTime
                        },onComplete);
                    } else if (voteName == "voteScrumPlanning2") {
                        ref.child("groups").child($rootScope.groupId).child("confirmedScrumPlanningDateTime2").set({
                            confirmedDate: highestVotedObject.votedDate,
                            confirmedDay: highestVotedObject.votedDay,
                            confirmedTime: highestVotedObject.votedTime
                        },onComplete);
                    } else if (voteName == "voteSprintRetrospective") {
                        ref.child("groups").child($rootScope.groupId).child("confirmedSprintReviewDateTime").set({
                            confirmedDate: highestVotedObject.votedDate,
                            confirmedDay: highestVotedObject.votedDay,
                            confirmedTime: highestVotedObject.votedTime
                        },onComplete);
                    } else if (voteName == "voteSprintReview") {
                        ref.child("groups").child($rootScope.groupId).child("confirmedSprintRetrospectiveDateTime").set({
                            confirmedDate: highestVotedObject.votedDate,
                            confirmedDay: highestVotedObject.votedDay,
                            confirmedTime: highestVotedObject.votedTime
                        },onComplete);
                    } else {
                        console.log("Problem!");
                    }  
        }

        //Scrum planning 1 selection
        $scope.selectDateTimeScrumPlanning1 = function(time, day, date) {
            $ionicLoading.show({
                template: 'Loading...'
            });
            
            ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").child("count").once('value', function (snapshot) {
                var numberOfVotes = snapshot.val();
                if(numberOfVotes==null){
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.scrumPlanning1Vote(time,day, 1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").child("count").set(1, onComplete);
                } else if (numberOfVotes==$scope.numberOfGroupMembers) {
                    $scope.initialise();
                } else if (numberOfVotes>0 && numberOfVotes<$scope.numberOfGroupMembers) {
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.scrumPlanning1Vote(time,day, numberOfVotes+1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").child("count").set(numberOfVotes+1, onComplete);
                } 
            });

            
        }

        $scope.scrumPlanning1Vote = function(time,day, number, date){
            if(number == $scope.numberOfGroupMembers){
                var done = function(){
                    $scope.setConfirmedDateTime("voteScrumPlanning1");
                };

                ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").push({
                        date: date,
                        day: day,
                        voteTime: time,
                        userId : $rootScope.userId
                    }, 
                    function() { 
                        $scope.initialise();
                },done);
            } else if (number>0 && number<$scope.numberOfGroupMembers){
                if($scope.myScrumPlanningVoteId1 == "" || $scope.myScrumPlanningVoteId1 == null){
                    console.log("\t\t myScrumPlanningVoteId1: "+$scope.myScrumPlanningVoteId1);
                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").push({
                            date: date,
                            day: day,
                            voteTime: time,
                            userId : $rootScope.userId
                        }, 
                        function() { 
                            $scope.initialise();
                    });
                } else {
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").child("count").once('value', function (snapshot) {
                                var numberOfVotes = snapshot.val();
                                if (numberOfVotes>0) {
                                    var onComplete = function(error) {
                                        if (error) {
                                            console.log('Synchronization failed');
                                        } else {
                                            console.log('Synchronization succeeded');
                                            ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").push({
                                                    date: date,
                                                    day: day,
                                                    voteTime: time,
                                                    userId : $rootScope.userId
                                                }, 
                                                function() { 
                                                    $scope.initialise();
                                            });
                                        }
                                    };
                                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").child("count").set(numberOfVotes-1, onComplete);
                                }
                            });
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").child($scope.myScrumPlanningVoteId1).remove(onComplete);
                }
            } else {
                console.log("Number is wrong!");
            }
        }

        //Scrum Planning 2 selection
        $scope.selectDateTimeScrumPlanning2 = function(time, day, date) {
            $ionicLoading.show({
                template: 'Loading...'
            });
            
            ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").child("count").once('value', function (snapshot) {
                var numberOfVotes = snapshot.val();
                if(numberOfVotes==null){
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.scrumPlanning2Vote(time,day, 1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").child("count").set(1, onComplete);
                } else if (numberOfVotes==$scope.numberOfGroupMembers) {
                    $scope.initialise();
                } else if (numberOfVotes>0 && numberOfVotes<$scope.numberOfGroupMembers) {
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.scrumPlanning2Vote(time,day, numberOfVotes+1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").child("count").set(numberOfVotes+1, onComplete);
                } 
            });

            
        }

        $scope.scrumPlanning2Vote = function(time,day,number,date){
            if(number == $scope.numberOfGroupMembers){
                var done = function(){
                    $scope.setConfirmedDateTime("voteScrumPlanning1");
                };

                ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").push({
                        date: date,
                        day: day,
                        voteTime: time,
                        userId : $rootScope.userId
                    }, 
                    function() { 
                        $scope.initialise();
                },done);
            } else if (number>0 && number<$scope.numberOfGroupMembers){
                if($scope.myScrumPlanningVoteId1 == "" || $scope.myScrumPlanningVoteId1 == null){
                    console.log("\t\t myScrumPlanningVoteId1: "+$scope.myScrumPlanningVoteId1);
                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").push({
                            date: date,
                            day: day,
                            voteTime: time,
                            userId : $rootScope.userId
                        }, 
                        function() { 
                            $scope.initialise();
                    });
                } else {
                    if($scope.myScrumPlanningVoteId2 == "" || $scope.myScrumPlanningVoteId2 == null){
                        console.log("\t\t myScrumPlanningVoteId2: "+$scope.myScrumPlanningVoteId2);
                        ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").push({
                                date: date,
                                day: day,
                                voteTime: time,
                                userId : $rootScope.userId
                            }, 
                            function() { 
                                $scope.initialise();
                        });
                    } else {
                        
                        var onComplete = function(error) {
                            if (error) {
                                console.log('Synchronization failed');
                            } else {
                                ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").child("count").once('value', function (snapshot) {
                                    var numberOfVotes = snapshot.val();
                                    if (numberOfVotes>0) {
                                        var onComplete = function(error) {
                                            if (error) {
                                                console.log('Synchronization failed');
                                            } else {
                                                console.log('Synchronization succeeded');
                                                ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").push({
                                                        date: date,
                                                        day: day,
                                                        voteTime: time,
                                                        userId : $rootScope.userId
                                                    }, 
                                                    function() { 
                                                        $scope.initialise();
                                                });
                                            }
                                        };
                                        ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").child("count").set(numberOfVotes-1, onComplete);
                                    }
                                });
                            }
                        };
                        ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning2").child($scope.myScrumPlanningVoteId2).remove(onComplete);
                    }
                }
            } else {
                console.log("Number is wrong!");
            }
        }
        
        //Sprint retrospective selection
        $scope.selectDateTimeSprintRetrospective = function(time, day, date) {
            $ionicLoading.show({
                template: 'Loading...'
            });
            
            ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").child("count").once('value', function (snapshot) {
                var numberOfVotes = snapshot.val();
                if(numberOfVotes==null){
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.sprintRetrospectiveVote(time,day, 1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").child("count").set(1, onComplete);
                } else if (numberOfVotes==$scope.numberOfGroupMembers) {
                    $scope.initialise();
                } else if (numberOfVotes>0 && numberOfVotes<$scope.numberOfGroupMembers) {
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.sprintRetrospectiveVote(time,day, numberOfVotes+1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").child("count").set(numberOfVotes+1, onComplete);
                } 
            });

            
        }

        $scope.sprintRetrospectiveVote = function(time,day, number, date){
            if(number == $scope.numberOfGroupMembers){
                var done = function(){
                    $scope.setConfirmedDateTime("voteScrumPlanning1");
                };

                ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").push({
                        date: date,
                        day: day,
                        voteTime: time,
                        userId : $rootScope.userId
                    }, 
                    function() { 
                        $scope.initialise();
                },done);
            } else if (number>0 && number<$scope.numberOfGroupMembers){
                if($scope.myScrumPlanningVoteId1 == "" || $scope.myScrumPlanningVoteId1 == null){
                    console.log("\t\t myScrumPlanningVoteId1: "+$scope.myScrumPlanningVoteId1);
                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").push({
                            date: date,
                            day: day,
                            voteTime: time,
                            userId : $rootScope.userId
                        }, 
                        function() { 
                            $scope.initialise();
                    });
                } else {
                    if($scope.mySprintRetrospectiveVoteId == "" || $scope.mySprintRetrospectiveVoteId == null){
                        console.log("\t\t mySprintRetrospectiveVoteId: "+$scope.mySprintRetrospectiveVoteId);
                        ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").push({
                                date: date,
                                day: day,
                                voteTime: time,
                                userId : $rootScope.userId
                            }, 
                            function() { 
                                $scope.initialise();
                        });
                    } else {
                        
                        var onComplete = function(error) {
                            if (error) {
                                console.log('Synchronization failed');
                            } else {
                                ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").child("count").once('value', function (snapshot) {
                                    var numberOfVotes = snapshot.val();
                                    if (numberOfVotes>0) {
                                        var onComplete = function(error) {
                                            if (error) {
                                                console.log('Synchronization failed');
                                            } else {
                                                console.log('Synchronization succeeded');
                                                ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").push({
                                                        date: date,
                                                        day: day,
                                                        voteTime: time,
                                                        userId : $rootScope.userId
                                                    }, 
                                                    function() { 
                                                        $scope.initialise();
                                                });
                                            }
                                        };
                                        ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").child("count").set(numberOfVotes-1, onComplete);
                                    }
                                });
                            }
                        };
                        ref.child("groups").child($rootScope.groupId).child("voteSprintRetrospective").child($scope.mySprintRetrospectiveVoteId).remove(onComplete);
                    }
                }
            } else {
                console.log("Number is wrong!");
            }
            
        }

        //Sprint Review selection
        $scope.selectDateTimeSprintReview = function(time, day, date) {
            $ionicLoading.show({
                template: 'Loading...'
            });
            
            ref.child("groups").child($rootScope.groupId).child("voteSprintReview").child("count").once('value', function (snapshot) {
                var numberOfVotes = snapshot.val();
                if(numberOfVotes==null){
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.sprintReviewVote(time,day, 1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteSprintReview").child("count").set(1, onComplete);
                } else if (numberOfVotes==$scope.numberOfGroupMembers) {
                    $scope.initialise();
                } else if (numberOfVotes>0 && numberOfVotes<$scope.numberOfGroupMembers) {
                    var onComplete = function(error) {
                        if (error) {
                            console.log('Synchronization failed');
                        } else {
                            console.log('Synchronization succeeded');
                            $scope.sprintReviewVote(time,day, numberOfVotes+1, date);
                        }
                    };
                    ref.child("groups").child($rootScope.groupId).child("voteSprintReview").child("count").set(numberOfVotes+1, onComplete);
                } 
            });

            
        }

        $scope.sprintReviewVote = function(time,day, number, date){
            if(number == $scope.numberOfGroupMembers){
                var done = function(){
                    $scope.setConfirmedDateTime("voteScrumPlanning1");
                };

                ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").push({
                        date: date,
                        day: day,
                        voteTime: time,
                        userId : $rootScope.userId
                    }, 
                    function() { 
                        $scope.initialise();
                },done);
            } else if (number>0 && number<$scope.numberOfGroupMembers){
                if($scope.myScrumPlanningVoteId1 == "" || $scope.myScrumPlanningVoteId1 == null){
                    console.log("\t\t myScrumPlanningVoteId1: "+$scope.myScrumPlanningVoteId1);
                    ref.child("groups").child($rootScope.groupId).child("voteScrumPlanning1").push({
                            date: date,
                            day: day,
                            voteTime: time,
                            userId : $rootScope.userId
                        }, 
                        function() { 
                            $scope.initialise();
                    });
                } else {
                    if($scope.mySprintReviewVoteId == "" || $scope.mySprintReviewVoteId == null){
                        console.log("\t\t mySprintReviewVoteId: "+$scope.mySprintReviewVoteId);
                        ref.child("groups").child($rootScope.groupId).child("voteSprintReview").push({
                                date: date,
                                day: day,
                                voteTime: time,
                                userId : $rootScope.userId
                            }, 
                            function() { 
                                $scope.initialise();
                        });
                    } else {
                        
                        var onComplete = function(error) {
                            if (error) {
                                console.log('Synchronization failed');
                            } else {
                                ref.child("groups").child($rootScope.groupId).child("voteSprintReview").child("count").once('value', function (snapshot) {
                                    var numberOfVotes = snapshot.val();
                                    if (numberOfVotes>0) {
                                        var onComplete = function(error) {
                                            if (error) {
                                                console.log('Synchronization failed');
                                            } else {
                                                console.log('Synchronization succeeded');
                                                ref.child("groups").child($rootScope.groupId).child("voteSprintReview").push({
                                                        date: date,
                                                        day: day,
                                                        voteTime: time,
                                                        userId : $rootScope.userId
                                                    }, 
                                                    function() { 
                                                        $scope.initialise();
                                                });
                                            }
                                        };
                                        ref.child("groups").child($rootScope.groupId).child("voteSprintReview").child("count").set(numberOfVotes-1, onComplete);
                                    }
                                });
                            }
                        };
                        ref.child("groups").child($rootScope.groupId).child("voteSprintReview").child($scope.mySprintReviewVoteId).remove(onComplete);
                    }
                }
            } else {
                console.log("Number is wrong!");
            }
            
        }
        $scope.initialise();
    }
})

.controller("DiscussionCtrl", function ($scope, $rootScope, $state, $ionicPopup, $ionicScrollDelegate, $ionicLoading) {
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

        var chatList = [];

        $scope.chat = {
            message: ""
        };

        $scope.initialise = function(){
            $ionicLoading.show({
                template: "Getting Messages . . ."
            });
            $scope.chatMessageList = angular.copy(chatList);

            ref.child("chat").child($rootScope.groupId).once("value",function(snapshot){
                var value = snapshot.val();
                console.log("value: "+value);
                if(value != null){
                    $scope.getChatMessages();
                } else {
                    $ionicLoading.hide();
                    $scope.getChatMessages();
                }
            })
            
        }

        $scope.getChatMessages = function(){
            ref.child("chat").child($rootScope.groupId).limitToLast(10).on("child_added", function(snapshot){
                var value = snapshot.val();
                console.log("Value: "+value);
                if(value != null) {
                    if(value.fullName == $rootScope.fullName){
                        value.fullName = "Me";
                    }
                    $scope.chatMessageList.push(value);
                    $ionicScrollDelegate.scrollBottom();
                    $ionicLoading.hide();
                } else {
                    $ionicLoading.hide();
                }
            });
        }

        $scope.sendMessage = function(chat){
            var chatMessage = chat.message;
            ref.child("chat").child($rootScope.groupId).push({
                fullName: $rootScope.fullName,
                message:  chatMessage
            });
            $scope.chat = {
                message: ""
            };
        }

        $scope.loadAllMessage = function(){
            console.log("load all message");
            $scope.chatMessageList = angular.copy(chatList);
            ref.child("chat").child($rootScope.groupId).once("value", function(snapshot){
                var value = snapshot.val();

                for(var data in value){
                    if (value.hasOwnProperty(data)) {
                        var object = value[data];
                        if(object.fullName == $rootScope.fullName){
                            object.fullName = "Me";
                        }
                        $scope.chatMessageList.push(object);
                        $ionicScrollDelegate.scrollBottom();
                    }
                    
                }
            });
        }

        $scope.initialise();
    }
})

.controller("TaskCtrl", function ($scope, $rootScope, $state,  $ionicModal, $ionicPopup, $ionicLoading, $ionicHistory) {
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
            if(task.taskName&&task.taskDescription){
                $ionicLoading.show({
                    template: 'Loading...'
                });
                $rootScope.task = task;
                ref.child("guidelines").child("count").once('value', function (snapshot) {
                    if(snapshot.val()==null){
                        $scope.numberOfGuidelines = 0;
                        console.log("snapshot.val is null");
                        $ionicLoading.hide();
                        $state.go("createGuideline");
                    } else if (snapshot.val()>=0) {
                        $scope.numberOfGuidelines = snapshot.val();
                        console.log("snapshot.val is: "+$scope.numberOfGuidelines);
                        $scope.getGuidelines(task, $scope.numberOfGuidelines);
                    }
                });
            } else {
                // An alert dialog
                var alertPopup = $ionicPopup.alert({
                    title: 'Error',
                    template: 'You are not logged in, please log in first'
                });
            }
        }

        $scope.getGuidelines = function (task, guidelineNumber){
            console.log("snapshot.val is: "+guidelineNumber);
            var counter = 1;
            var isExist= false;
            if(guidelineNumber > 0){
                ref.child("guidelines").orderByChild("keywords").on("child_added", function (snapshot) {
                    var value = snapshot.val();
                    value.key = String(snapshot.key());
                   console.log("counter:"+value.keywords);
                    if((value.key != "count")&&(typeof value.keywords !== "undefined")){
                        var keywordInString = String(value.keywords);
                        var keywords = keywordInString.split(",");
                        console.log ("keywords: "+keywords+" : keywordInString: "+keywordInString);
                        for(i=0; i<keywords.length;i++){
                            if(!~task.taskDescription.indexOf(keywords[i].trim())){
                                console.log("don't exist?");
                                break;
                            }

                            if(i==keywords.length-1){
                                $rootScope.guidelines = value;
                                $ionicLoading.hide();
                                $state.go("confirmCreateTask");
                            }
                        }

                        if ((counter==guidelineNumber)&&(!isExist)){
                            console.log("here???");
                            $ionicLoading.hide();
                            $state.go("createGuideline");
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
            $state.go("lecturer-tab.tasks");
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
            })

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
                        ref.child("guidelines").child("count").set(1, onComplete);
                    } else if ($scope.numberOfGuidelines>0) {
                        var onComplete = function(error) {
                            if (error) {
                                console.log('Synchronization failed');
                            } else {
                                console.log('Synchronization succeeded');
                            }
                        };
                        ref.child("guidelines").child("count").set($scope.numberOfGuidelines+1, onComplete);
                    }
                    $rootScope.guidelines = guidelines;
                    $ionicLoading.hide();
                    $state.go("confirmCreateTask");
                });
                
                
            }
            $rootScope.guidelineId = guidelineRef.key();
        }



        $scope.showEditGuidelines = function (task) {
            $rootScope.task = task;
            $state.go("createGuideline");
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

        $scope.editTask = function(task){
            $scope.editTaskModal.show();
            $scope.taskItem = task;
        }

        $scope.updateTaskItem = function(taskItem){
            $scope.editTaskModal.hide();
            ref.child("guidelines").child("count").once('value', function (snapshot) {
                if(snapshot.val()==null){
                    $scope.numberOfGuidelines = 0;
                    console.log("snapshot.val is null");
                    $ionicLoading.hide();
                    $scope.lecturerCreateGuidelineModal.show();
                } else if (snapshot.val()>=0) {
                    $scope.numberOfGuidelines = snapshot.val();
                    console.log("snapshot.val is: "+$scope.numberOfGuidelines);
                    $scope.getGuidelinesUpdate(taskItem, $scope.numberOfGuidelines);
                }
            });
        }

        $scope.getGuidelinesUpdate = function (task, guidelineNumber){
            $rootScope.taskItems = task;
            console.log("snapshot.val is: "+guidelineNumber);
            var counter = 1;
            var isExist= false;
            if(guidelineNumber > 0){
                ref.child("guidelines").orderByChild("keywords").on("child_added", function (snapshot) {
                    var value = snapshot.val();
                    value.key = String(snapshot.key());
                   
                    if((value.key != "count")&&(typeof value.keywords !== "undefined")){
                        var keywordInString = String(value.keywords);
                        var keywords = keywordInString.split(",");
                        console.log ("keywords: "+keywords+" : keywordInString: "+keywordInString);
                        for(i=0; i<keywords.length;i++){
                            if(!~task.taskDescription.indexOf(keywords[i].trim())){
                                console.log("don't exist?");
                                break;
                            }

                            if(i==keywords.length-1){
                                $rootScope.guidelines = value;
                                $ionicLoading.hide();
                                $state.go("confirmEditTask");
                            }
                        }

                        if ((counter==guidelineNumber)&&(!isExist)){
                            $ionicLoading.hide();
                            $state.go("createGuidelineUpdate");
                        }
                        counter++;
                    }
                });
            }
        }

        $scope.createGuidelineUpdate = function (guidelines){
            $ionicLoading.show({
                template: 'Loading...'
            });

            var guidelineRef = ref.child("guidelines").push({
                keywords: guidelines.keyword,
                dataStructure: guidelines.dataStructure,
                dataType: guidelines.dataType,
                controlStructure: guidelines.controlStructure,
                arithmeticExpression: guidelines.arithmeticExpression
            })

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
                        ref.child("guidelines").child("count").set(1, onComplete);
                    } else if ($scope.numberOfGuidelines>0) {
                        var onComplete = function(error) {
                            if (error) {
                                console.log('Synchronization failed');
                            } else {
                                console.log('Synchronization succeeded');
                            }
                        };
                        ref.child("guidelines").child("count").set($scope.numberOfGuidelines+1, onComplete);
                    }
                    $rootScope.guidelines = guidelines;
                    $ionicLoading.hide();
                    $state.go("confirmEditTask");
                });
            }
            $rootScope.guidelineId = guidelineRef.key();
        }

        $scope.updateTask = function(task,guidelines){
            ref.child("tasks").child(task.key).update({
                taskName: task.taskName,
                taskDescription: task.taskDescription,
                taskGuideline: guidelines
            });
            $scope.taskList.length = 0;
            $scope.getTaskCreated();
            $state.go("lecturer-tab.tasks");
        }

        $scope.editGuideline = function(guideline){
            $rootScope.guidelines=guideline;
            $state.go("editGuideline");
        }

        $scope.deleteTaskFromFirebase = function(task) {
            ref.child("tasks").child(task.key).remove();
            console.log(task.Key + " deleted");
            alert(task.taskName + " deleted~");
            $scope.taskList.length = 0;
            $scope.getTaskCreated();
            $state.go("lecturer-tab.tasks");
        }

        $scope.viewTaskDetails = function (task){
            console.log("task: "+task.key);
            console.log("task.guidelines: "+task.taskGuideline.dataStructure);
            $rootScope.taskDetails = {
                key: task.key,
                taskName: task.taskName,
                taskDescription: task.taskDescription,
                taskGuideline: task.taskGuideline
            }

            $state.go("tasksDetails");
        }

        $scope.goBack = function(){
            console.log("goback fired");
            $ionicHistory.goBack();
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
            $scope.getTaskList();
        }

        $scope.getTaskList = function(){
            
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
