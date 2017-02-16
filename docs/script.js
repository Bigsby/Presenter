(function () {
    "use strict";
    function processTopics(topic) {
        if (topic.duration)
            return;

        var topicDuration = 0;

        if (topic.innerTopics)
            topic.innerTopics.forEach(function (innerTopic, index) {
                innerTopic.parent = topic;
                innerTopic.index = index;
                innerTopic.selected = false;
                innerTopic.expanded = false;
                topicDuration += innerTopic.duration;
                processTopics(innerTopic);
            });
        topic.duration = topicDuration;
    }

    var appName = "app";
    var app = angular.module(appName, ["ui.router"]);
    var currentPresentation;



    function getPresentation($http, vm, presentationId, callback) {
        var url = "presentations/" + presentationId + "/data.json";
        $http.get(url).then(function (response) {
            angular.extend(vm, response.data);
            processTopics(vm);

            if (callback)
                callback();
        });
    }

    app.controller("presentationController", ["$http", "$stateParams", "$state", "$window", "$scope",
        function ($http, $stateParams, $state, $window, $scope) {
            var displayWindow;
            var vm = this;
            angular.extend(vm, $stateParams);
            vm.isRoot = true;

            function unSelectAll(parent) {
                if (parent.innerTopics)
                    parent.innerTopics.forEach(function (innerTopic) {
                        innerTopic.selected = false;
                        unSelectAll(innerTopic);
                    });
            }

            function selectTopic(selected) {
                unSelectAll(vm);

                vm.selectedTopic = selected;
                selected.selected = true;
            }

            function previous() {
                var previousTopic;

                if (!vm.selectedTopic)
                    previousTopic = vm.innerTopics[vm.innerTopics.length - 1];
                else if (vm.selectedTopic.index)
                    previousTopic = vm.selectedTopic.parent.innerTopics[vm.selectedTopic.index - 1];
                else if (!vm.selectedTopic.parent.isRoot) previousTopic = vm.selectedTopic.parent;

                if (previousTopic)
                    vm.shower.show(previousTopic, true);
            }

            function selectNextFromParent(parent, currentIndex) {
                if (!parent)
                    return null;

                if (!parent.innerTopics && !parent.innerTopics.length)
                    return;

                if (parent.innerTopics.length > currentIndex + 1)
                    return parent.innerTopics[currentIndex + 1];

                return selectNextFromParent(parent.parent, parent.index);
            }

            function next(recursive) {
                var nextTopic;
                if (!vm.selectedTopic)
                    nextTopic = vm.innerTopics[0];
                else if (vm.selectedTopic.innerTopics && vm.selectedTopic.innerTopics.length && (vm.selectedTopic.expanded || recursive)) {
                    vm.selectedTopic.expanded = true;
                    nextTopic = vm.selectedTopic.innerTopics[0];
                }
                else
                    nextTopic = selectNextFromParent(vm.selectedTopic.parent, vm.selectedTopic.index);

                if (nextTopic)
                    vm.shower.show(nextTopic, true);
            }

            function toggle(value) {
                vm.selectedTopic.expanded = value;
            }

            $window.onkeydown = function (event) {
                $scope.$evalAsync(function () {
                    var which = event.which;
                    if (which === 32 || which === 13)
                        next(true);

                    if (which === 40)
                        next(false);

                    if (which === 38)
                        previous();

                    if (which === 39)
                        toggle(true);

                    if (which === 37)
                        toggle(false);

                    if (which === 80)
                        vm.togglePresentation();
                });
            }

            getPresentation($http, vm, vm.presentationId, null, true);

            function getSlideUrl() {
                return vm.selectedTopic && vm.selectedTopic.slide ?
                    $state.href("slide", { presentationId: vm.presentationId, slideId: vm.selectedTopic.slide })
                    :
                    "templates/slidesHome.html";
            }

            vm.shower = {
                show: function (topic) {
                    selectTopic(topic);

                    if (displayWindow && topic.slide)
                        displayWindow.location.assign(getSlideUrl());
                }
            };

            vm.togglePresentation = function () {
                if (!displayWindow || displayWindow.closed)
                    displayWindow = window.open(getSlideUrl(), "presentationWindow");
                else {
                    displayWindow.close();
                    displayWindow = null;
                }
            }
        }]);

    app.controller("presentationsListController", ["$http", "$state", function ($http, $state) {
        var vm = this;

        $http.get("data/presentations.json").then(function (response) {
            angular.extend(vm, response.data);
            //setDuration(vm);
        });

        vm.go = function (presentation) {
            console.log("Going: " + presentation.id);
            $state.go("presenter", { presentationId: presentation.id });
        }
    }]);

    app.controller("slideController", ["$http", "$stateParams", function ($http, $stateParams) {
        var vm = this;
        angular.extend(vm, $stateParams);
        vm.presentation = {};

        function setPath() {
            var path = [];
            var current = vm.topic;
            while (current && current.parent && current.parent.name) {
                path.push(current.parent.name);
                current = current.parent;
            }
            path.reverse();
            vm.path = path;
        }

        function findTopic(parent) {
            if (parent.innerTopics)
                parent.innerTopics.forEach(function (topic) {
                    if (topic.slide === vm.slideId) {
                        vm.topic = topic;
                        setPath();
                    }
                    findTopic(topic);
                });
        }
        function setTopic() {
            findTopic(vm.presentation);
        }
        getPresentation($http, vm.presentation, vm.presentationId, setTopic, false);
        vm.slideUrl = "presentations/" + vm.presentationId + "/" + vm.slideId + ".html";
    }]);

    app.component("presenter", {
        templateUrl: "templates/presenter.html",
        controller: "presentationController"
    });

    app.component("topic", {
        templateUrl: "templates/topicTemplate.html",
        bindings: {
            topic: "<",
            index: "<",
            previousPath: "<",
            showDuration: "<",
            shower: "<"
        }
    });

    app.component("presentationList", {
        templateUrl: "templates/presentationsList.html",
        controller: "presentationsListController"
    });

    app.component("slidePresenter", {
        templateUrl: "templates/slidesPresenter.html",
        controller: "slideController"
    });

    app.config(["$stateProvider", "$httpProvider", "$sceProvider", "$urlRouterProvider", function ($stateProvider, $httpProvider, $sceProvider, $urlRouterProvider) {
        $httpProvider.defaults.useXDomain = true;

        $sceProvider.enabled(false);

        $stateProvider.state({
            name: "home",
            url: "/",
            component: "presentationList"
        });

        $stateProvider.state({
            name: "presenter",
            url: "/:presentationId",
            component: "presenter"
        });

        $stateProvider.state({
            name: "slide",
            url: "/:presentationId/:slideId",
            component: "slidePresenter"
        });

        $urlRouterProvider.otherwise("/");
    }]);

    angular.bootstrap(document, [appName]);
})();

/*
 * TODO:
 * keys (requires setting parent and index on topics): 
 *  > SPACE (32) | DOWN (40) | ENTER (13) > next topic
 *  > UP (38) > previous topic
 *  > RIGHT (39) > expand topic
 *  > LEFT (37 > collapse topic
 * time control
 */