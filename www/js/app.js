var firebaseUrl = "https://tutorial-bucket-list.firebaseio.com/";

function onDeviceReady() {
    angular.bootstrap(document, ["mapal"]);
}
//console.log("binding device ready");
// Registering onDeviceReady callback with deviceready event
document.addEventListener("deviceready", onDeviceReady, false);

// 'mapal.services' is found in services.js
// 'mapal.controllers' is found in controllers.js
angular.module('mapal', ['ionic', 'firebase', 'angularMoment', 'mapal.controllers', 'mapal.services'])

.run(function ($ionicPlatform, $rootScope, $location, Auth, $ionicLoading, $state) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        // To Resolve Bug
        ionic.Platform.fullScreen();

        $rootScope.firebaseUrl = firebaseUrl;
        $rootScope.displayName = null;

        Auth.$onAuth(function (authData) {
            if (authData) {
                console.log("Logged in as:", authData.email);
            } else {
                console.log("Logged out");
                $ionicLoading.hide();
                $location.path('/common/login');
            }
        });

        $rootScope.logout = function () {
            console.log("Logging out from the app");
            $ionicLoading.show({
                template: 'Logging Out...'
            });
            Auth.$unauth();
        }

        $rootScope.aboutUs = function () {
            console.log("Aboutus btn clicked");
            $state.go('aboutUs');
        }


        $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
            // We can catch the error thrown when the $requireAuth promise is rejected
            // and redirect the user back to the home page
            if (error === "AUTH_REQUIRED") {
                $location.path("/common/login");
            }
        });
    });
})

.config(function ($stateProvider, $urlRouterProvider) {
    console.log("setting config");
    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // State to represent Login View
    .state('login', {
        url: "/login",
        templateUrl: "templates/common/login.html",
        controller: 'LoginCtrl',
        resolve: {
            // controller will not be loaded until $waitForAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $waitForAuth returns a promise so the resolve waits for it to complete
                    return Auth.$waitForAuth();
        }]
        }
    })

    // State to represent Login View
    .state('aboutUs', {
        url: "/aboutUs",
        templateUrl: "templates/common/aboutUs.html",
        controller: '',
        resolve: {
            // controller will not be loaded until $waitForAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $waitForAuth returns a promise so the resolve waits for it to complete
                    return Auth.$waitForAuth();
        }]
        }
    })

    // State to represent studentAddClassSchedule View
    .state('studentAddClassSchedule', {
        url: "/common/studentAddClassSchedule",
        templateUrl: "templates/common/studentAddClassSchedule.html",
        controller: 'ClassScheduleCtrl',
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // State to represent leaderViewClassSchedule View
    .state('leaderViewClassSchedule', {
        url: "/leader/leaderViewClassSchedule",
        templateUrl: "templates/leader/leaderViewClassSchedule.html",
        controller: 'ClassScheduleCtrl',
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // State to represent leaderViewClassSchedule View
    .state('studentViewClassSchedule', {
        url: "/student/studentViewClassSchedule",
        templateUrl: "templates/student/studentViewClassSchedule.html",
        controller: 'ClassScheduleCtrl',
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // State to represent ViewGroupList View
    .state('student-viewGroupList', {
        url: "/student/student-viewGroupList",
        templateUrl: "templates/student/student-ViewGroupList.html",
        controller: 'ViewGroupListCtrl',
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // State to represent leader-viewGroupMemberList View
    .state('leader-viewGroupMemberList', {
        url: "/leader/leader-viewGroupMemberList",
        templateUrl: "templates/leader/leader-viewGroupMemberList.html",
        controller: 'ViewGroupMemberListCtrl',
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // State to represent student-viewGroupMemberList View
    .state('student-viewGroupMemberList', {
        url: "/student/student-viewGroupMemberList",
        templateUrl: "templates/student/student-viewGroupMemberList.html",
        controller: 'ViewGroupMemberListCtrl',
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })


    // State to represent CreateGroup View
    .state('leader-CreateGroup', {
        url: "/leader/leader-CreateGroup",
        templateUrl: "templates/leader/leader-CreateGroup.html",
        controller: 'GroupCtrl',
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // State to represent leaderAddClassSchedule View
    .state('leaderAddClassSchedule', {
        url: "/common/leaderAddClassSchedule",
        templateUrl: "templates/common/leaderAddClassSchedule.html",
        controller: 'ClassScheduleCtrl',
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // State to represent leaderAddClassSchedule View
    .state('leader-confirmCreateGroup', {
        url: "/leader/leader-confirmCreateGroup",
        templateUrl: "templates/leader/leader-confirmCreateGroup.html",
        controller: 'GroupCtrl',
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // setup an abstract state for STUDENT tabs directive
    .state('student-tab', {
        url: "/student/student-tab",
        abstract: true,
        templateUrl: "templates/student/student-tab.html",
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // Each tab has its own nav history stack:
    .state('student-tab.timeline', {
        url: '/student/student-tab-timeline',
        views: {
            'student-tab-timeline': {
                templateUrl: 'templates/student/student-tab-timeline.html',
                controller: 'TimelineController'
            }
        }
    })

    .state('student-tab.task', {
        url: '/student/student-tab-task',
        views: {
            'student-tab-task': {
                templateUrl: 'templates/student/student-tab-task.html',
                controller: 'TaskCtrl'
            }
        }
    })

    .state('student-tab.groupMembers', {
        url: '/student/student-tab-groupMembers',
        views: {
            'student-tab-groupMembers': {
                templateUrl: 'templates/student/student-tab-groupMembers.html',
                controller: 'ViewGroupMemberListCtrl'
            }
        }
    })

    .state('student-tab.discussion', {
        url: '/student/student-tab-discussion',
        views: {
            'student-tab-discussion': {
                templateUrl: 'templates/student/student-tab-discussion.html',
                controller: 'DiscussionCtrl'
            }
        }
    })

    .state('student-tab.my_class', {
        url: '/student/student-tab-my_class',
        views: {
            'student-tab-my_class': {
                templateUrl: 'templates/student/student-tab-my_class.html',
                controller: 'ClassScheduleCtrl'
            }
        }
    })

    // setup an abstract state for LEADER tabs directive
    .state('leader-tab', {
        url: "/leader/leader-tab",
        abstract: true,
        templateUrl: "templates/leader/leader-tab.html",
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // Each tab has its own nav history stack:
    .state('leader-tab.timeline', {
        url: '/leader/leader-tab-timeline',
        views: {
            'leader-tab-timeline': {
                templateUrl: 'templates/leader/leader-tab-timeline.html',
                controller: 'TimelineController'
            }
        }
    })

    .state('leader-tab.task', {
        url: '/leader/leader-tab-task',
        views: {
            'leader-tab-task': {
                templateUrl: 'templates/leader/leader-tab-task.html',
                controller: 'TaskCtrl'
            }
        }
    })

    .state('leader-tab.groupMembers', {
        url: '/leader/leader-tab-groupMembers',
        views: {
            'leader-tab-groupMembers': {
                templateUrl: 'templates/leader/leader-tab-groupMembers.html',
                controller: 'ViewGroupMemberListCtrl'
            }
        }
    })

    .state('leader-tab.discussion', {
        url: '/leader/leader-tab-discussion',
        views: {
            'leader-tab-discussion': {
                templateUrl: 'templates/leader/leader-tab-discussion.html',
                controller: 'DiscussionCtrl'
            }
        }
    })

    .state('leader-tab.my_class', {
        url: '/leader/leader-tab-my_class',
        views: {
            'leader-tab-my_class': {
                templateUrl: 'templates/leader/leader-tab-my_class.html',
                controller: 'ClassScheduleCtrl'
            }
        }
    })

    // setup an abstract state for LEADER tabs directive
    .state('lecturer-tab', {
        url: "/lecturer/lecturer-tab",
        abstract: true,
        templateUrl: "templates/lecturer/lecturer-tab.html",
        resolve: {
            // controller will not be loaded until $requireAuth resolves
            // Auth refers to our $firebaseAuth wrapper in the example above
            "currentAuth": ["Auth",
                function (Auth) {
                    // $requireAuth returns a promise so the resolve waits for it to complete
                    // If the promise is rejected, it will throw a $stateChangeError (see above)
                    return Auth.$requireAuth();
            }]
        }
    })

    // Each tab has its own nav history stack:
    .state('lecturer-tab.report', {
        url: '/lecturer/lecturer-tab-report',
        views: {
            'lecturer-tab-report': {
                templateUrl: 'templates/lecturer/lecturer-tab-report.html',
                controller: 'ReportCtrl'
            }
        }
    })

    .state('lecturer-tab.students', {
        url: '/lecturer/lecturer-tab-students',
        views: {
            'lecturer-tab-students': {
                templateUrl: 'templates/lecturer/lecturer-tab-students.html',
                controller: 'StudentsCtrl'
            }
        }
    })

    .state('lecturer-tab.tasks', {
        url: '/lecturer/lecturer-tab-tasks',
        views: {
            'lecturer-tab-tasks': {
                templateUrl: 'templates/lecturer/lecturer-tab-tasks.html',
                controller: 'TaskCtrl'
            }
        }
    })

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

});