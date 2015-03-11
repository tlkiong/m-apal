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
                        $rootScope.groupId = val.groupId;
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

.controller('ClassScheduleCtrl', function ($scope, $rootScope, $ionicModal, $ionicLoading, $state, $ionicPopup, $firebaseAuth, $ionicNavBarDelegate) {
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
        

        var ref = new Firebase($scope.firebaseUrl);

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

        $scope.studentGoTimeline = function(){
            $state.go('student-tab.timeline');
        }

        $scope.leaderGoTimeline = function(){
            $state.go('leader-tab.timeline');
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
            $ionicNavBarDelegate.back();
        }

        $scope.getClassTimetable($rootScope.userId);
    }
})

.controller('GroupCtrl', function ($scope, $rootScope, $state, $ionicPopup) {
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
        var ref = new Firebase($scope.firebaseUrl);
        ref.child("tasks").orderByChild("taskName").on("child_added", function (snapshot) {
            var value = snapshot.val();
        });
        
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
                startDate : group.startDate,
                taskName : Task.taskName,
                taskDescription : Task.taskDescription,
                taskGuideline : "Empty guidelines first"
            };
            $state.go('leader-confirmCreateGroup');
        }

        $scope.confirmCreateGroup = function (group){
            console.log("In ConfirmCreateGroup")
            try{
                var groupRef = ref.child("groups").push({
                    groupName: group.groupName,
                    groupStartDate: group.startDate,
                    groupTask: group.taskName,
                    groupTaskDescription: group.taskDescription,
                    groupTaskGuideline: group.taskGuideline,
                    groupStatus: 'pending'
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
    }
})

.controller('ViewGroupMemberListCtrl', function ($scope, $rootScope, $state, $ionicPopup) {
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

        var ref = new Firebase($scope.firebaseUrl);

        $scope.userList = [];

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

        // ref.child("groups").child($rootScope.groupId).child("groupStatus").on('child_changed', function(childSnapshot, prevChildName){
        //     if(childSnapshot == "active"){
        //         if($rootScope.role=="leader"){
        //             $state.go('leader-tab.timeline');
        //         } else if ($rootScope.role=="student"){
        //             $state.go('student-tab.timeline');
        //         } else {
        //             console.log("is neither leader or student");
        //         }
        //     }
        // });

        $scope.studentGoTimeline = function(){
            $state.go('student-tab.timeline');
        }

        $scope.leaderGoTimeline = function(){
            $state.go('leader-tab.timeline');
        }

        $scope.studentViewClassSchedule = function(){
            $state.go('studentViewClassSchedule')
        }

        $scope.leaderViewClassSchedule = function(){
            $state.go('leaderViewClassSchedule')
        }

        $scope.closeGroup = function () {
            ref.child("groups").child($rootScope.groupId).update({
                groupStatus: "active"
            });
            $state.go('leader-tab.timeline');
        }
    }
})

.controller('ViewGroupListCtrl', function ($scope, $rootScope, $state, $ionicPopup) {
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

        var ref = new Firebase($scope.firebaseUrl);

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
            ref.child("users").child($rootScope.userId).update({
                groupId: item.key
            });
            $rootScope.groupId = item.key;
            $state.go('student-viewGroupMemberList');
        }
    }
})

.controller('TimelineController', function ($scope, $rootScope, $state, $ionicPopup) {
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

        var ref = new Firebase($scope.firebaseUrl);

        $scope.mondayList = [];
        $scope.tuesdayList = [];
        $scope.wednesdayList = [];
        $scope.thursdayList = [];
        $scope.fridayList = [];

        for (var i = 8; i < 19; i++){
            $scope.mondayList.push(i);
            $scope.tuesdayList.push(i);
            $scope.wednesdayList.push(i);
            $scope.thursdayList.push(i);
            $scope.fridayList.push(i);
        }
        
        var userList = [];

        ref.child("users").orderByChild("groupId").on("child_added", function (snapshot) {
            var value = snapshot.val();
            if(value.groupId == $rootScope.groupId){
                value.key = String(snapshot.key());
                $scope.getUsersTimetable(value.key);
            }
        });

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
                        while(classStartTimeHour != (classEndTimeHour+1)){
                            var index = $scope.fridayList.indexOf(classStartTimeHour);
                            if(index > -1){
                                $scope.fridayList.splice(index,1);
                            }
                            classStartTimeHour++;
                        }
                    }
                    break;
                    case "Monday":{
                        while(classStartTimeHour != (classEndTimeHour+1)){
                            var index = $scope.mondayList.indexOf(classStartTimeHour);
                            if(index > -1){
                                $scope.mondayList.splice(index,1);
                            }
                            classStartTimeHour++;
                        }
                    }
                    break;
                    case "Tuesday":{
                        while(classStartTimeHour != (classEndTimeHour+1)){
                            var index = $scope.tuesdayList.indexOf(classStartTimeHour);
                            if(index > -1){
                                $scope.tuesdayList.splice(index,1);
                            }
                            classStartTimeHour++;
                        }
                    }
                    break;
                    case "Thursday":{
                        while(classStartTimeHour != (classEndTimeHour+1)){
                            var index = $scope.thursdayList.indexOf(classStartTimeHour);
                            if(index > -1){
                                $scope.thursdayList.splice(index,1);
                            }
                            classStartTimeHour++;
                        }
                    }
                    break;
                    case "Wednesday":{
                        while(classStartTimeHour != (classEndTimeHour+1)){
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


            
    }
})

.controller('DiscussionCtrl', function ($scope, $rootScope, $state, $ionicPopup) {
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

        var ref = new Firebase($scope.firebaseUrl);
    }
})

.controller('TaskCtrl', function ($scope, $rootScope, $state,  $ionicModal, $ionicPopup) {
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

        var ref = new Firebase($scope.firebaseUrl);

        //itemOptionModal
        $ionicModal.fromTemplateUrl('templates/common/taskItemOptionModal.html', {
            scope: $scope
        }).then(function (taskItemOptionModal) {
            $scope.taskItemOptionModal = taskItemOptionModal;
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

        ref.child("groups").child($rootScope.groupId).once('value', function (snapshot) {
            var val = snapshot.val();
            $scope.myTask = val;
        });

        $scope.closeGroup = function(){
            ref.child("groups").child($rootScope.groupId).update({
                groupStatus: 'disabled'
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

        $scope.createTask = function (task) {
            $scope.getGuidelines(taskItem);
            
            console.log("we are in createTask!");
            ref.child("tasks").push({
                    taskName: task.taskName,
                    taskDescription: task.taskDescription
                    //taskGuideline: guidelines
                });
            $scope.getTaskCreated();
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

        $scope.getGuidelines = function (task){
            //TODO: for guidelines
            // ref.child("guidelines").orderByChild("dataStructure").on("child_added", function (snapshot){
            //     var value = snapshot.val();
            //     if(value.dataStructure == task.taskName){
            //         var array = task.taskDescription.split(' ');

            //         for(var i = 0; i < array.length; i++){
            //             console.log("array " + i + " = " + array[i]);
            //         }
            //     } else {
            //         Console.log("takda takda");
            //     }
            // })
        }

        $scope.getTaskCreated();

    }
})

.controller('StudentsCtrl', function ($scope, $rootScope, $state, $ionicPopup) {
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

        
    }
})

.controller('ReportCtrl', function ($scope, $rootScope, $state, $ionicPopup) {
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

        
    }
})