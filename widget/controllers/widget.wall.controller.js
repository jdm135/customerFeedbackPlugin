'use strict';

(function (angular, buildfire) {
  angular
    .module('customerFeedbackPluginWidget')
      .controller('WidgetWallCtrl', ['$scope','$location', '$rootScope', 'DataStore', 'TAG_NAMES', 'ViewStack', 'EVENTS',
        function ($scope, $location, $rootScope, DataStore, TAG_NAMES, ViewStack, EVENTS) {

          var WidgetWall = this;
          var skip = 0;
          var limit = 5;
          var currentView = ViewStack.getCurrentView();
          WidgetWall.waitAPICompletion = false;
          WidgetWall.noMore = false;

          console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
          /* Initialize current logged in user as null. This field is re-initialized if user is already logged in or user login user auth api.
           */
          WidgetWall.currentLoggedInUser = null;

            function init() {
                var success = function (result) {
                        WidgetWall.data = result.data;
                        if (!WidgetWall.data.design)
                            WidgetWall.data.design = {};
                        /*if (!WidgetHome.data.content)
                         WidgetHome.data.content = {};*/
                        console.log("WidgetHome.data.design.backgroundImage", WidgetWall.data.design.backgroundImage);
                        if (!WidgetWall.data.design.backgroundImage) {
                            $rootScope.backgroundImage = "";
                        } else {
                            $rootScope.backgroundImage = WidgetWall.data.design.backgroundImage;
                        }
//                        getReviews();
                    }
                    , error = function (err) {
                        console.error('Error while getting data', err);
                    };
                DataStore.get(TAG_NAMES.FEEDBACK_APP_INFO).then(success, error);
            }

            init();

            WidgetWall.getReviews = function () {
                // buildfire.history.push('Submit Reviewsss', {});
                console.log('Inside getReviews---------');
                if(!WidgetWall.waitAPICompletion) {
                    WidgetWall.waitAPICompletion = true;
                    buildfire.userData.search({sort: {addedDate: -1}, skip: skip, limit: limit}, 'AppRatings2', function (err, results) {
                        if (err) {
                            console.error("++++++++++++++ctrlerrddd", JSON.stringify(err));
                            $location.path('/');
                            $scope.$apply();
                        }
                        else {
                            console.log("++++++++++++++ctrldd", results)
                            if (results.length < limit) {
                                WidgetWall.noMore = true;
                            }
                            WidgetWall.data.reviews = WidgetWall.data.reviews ? WidgetWall.data.reviews : [];
                            WidgetWall.data.reviews = WidgetWall.data.reviews.concat(results);
                            //WidgetWall.lastRating = results[results.length-1].data.startRating;
                            WidgetWall.ratingsTotal = results.reduce(function (a, b) {
                                return {data: {startRating: a.data.startRating + b.data.startRating}}; // returns object with property x
                            })
                            WidgetWall.startPoints = WidgetWall.ratingsTotal.data.startRating / (WidgetWall.data.reviews.length );
                            WidgetWall.lastRating = WidgetWall.data && WidgetWall.data.reviews && WidgetWall.data.reviews.length && WidgetWall.data.reviews[WidgetWall.data.reviews.length - 1].data.startRating;
                            //$scope.complains = results;
                            skip = skip + results.length;
                            $scope.$apply();
                        }
                        WidgetWall.waitAPICompletion = false;
                    });
                }
            }

          /**
           * Method to open buildfire auth login pop up and allow user to login using credentials.
           */
          WidgetWall.openLogin = function () {
            buildfire.auth.login({}, function () {

            });
            $scope.$apply();
          };

          var loginCallback = function () {
            buildfire.auth.getCurrentUser(function (err, user) {
              console.log("_______________________rrr", user);

              $scope.$digest();
              if (user) {
                WidgetWall.currentLoggedInUser = user;
                console.log("_______________________rrr22", user);
                $location.path('/');
                $scope.$apply();
              }
            });
          };

         /* WidgetWall.goBack = function(){
            $location.path("/submit");
          }*/

            WidgetWall.submitReview = function () {
                ViewStack.push({
                    template: 'submit',
                    params: {
                        lastReviewCount: WidgetWall.lastRating
                     }
                });
            };

            $rootScope.$on(EVENTS.REVIEW_CREATED, function (e, result) {
                console.log('inside review added event listener:::::::::::', result);
                WidgetWall.data.reviews.push(result.data);
                WidgetWall.ratingsTotal = WidgetWall.data.reviews.reduce(function (a, b) {
                    return {data:{startRating: a.data.startRating + b.data.startRating}}; // returns object with property x
                })
                WidgetWall.startPoints = WidgetWall.ratingsTotal.data.startRating / (WidgetWall.data.reviews.length );
                WidgetWall.lastRating = WidgetWall.data && WidgetWall.data.reviews && WidgetWall.data.reviews.length && WidgetWall.data.reviews[WidgetWall.data.reviews.length-1].data.startRating;
                if (!$scope.$$phase)
                    $scope.$digest();
            });

          /**
           * onLogin() listens when user logins using buildfire.auth api.
           */
          buildfire.auth.onLogin(loginCallback);

          /**
           * Check for current logged in user, if not show ogin screen
           */
          buildfire.auth.getCurrentUser(function (err, user) {
              init();
            console.log("_______________________ssss", user);
            if (user) {
              WidgetWall.currentLoggedInUser = user;
            }
            else
              WidgetWall.openLogin();
          });

            var onUpdateCallback = function (event) {

                setTimeout(function () {
                    if (event) {
                        switch (event.tag) {
                            case TAG_NAMES.FEEDBACK_APP_INFO:
                                WidgetWall.data = event.data;
                                if (!WidgetWall.data.design)
                                    WidgetWall.data.design = {};
                                /*if (!WidgetWall.data.content)
                                 WidgetWall.data.content = {};*/
                                if (!event.data.design.backgroundImage) {
                                    $rootScope.backgroundImage = "";
                                } else {
                                    $rootScope.backgroundImage = event.data.design.backgroundImage;
                                }
                                break;
                        }
                        $rootScope.$digest();
                    }
                }, 0);
            };

            /**
             * DataStore.onUpdate() is bound to listen any changes in datastore
             */
            DataStore.onUpdate().then(null, null, onUpdateCallback);
        }]);
})(window.angular, window.buildfire);

