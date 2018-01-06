/* This is our AngularJS controller, called "ExampleController". */
registerController('CredentialSearch_Controller', ['$api', '$scope', function($api, $scope) {
    /* It is good practice to 'initialize' your variables with nothing */
    $scope.greeting = "";
    $scope.content = "";
    $scope.title = "Loading...";
    $scope.version = "Loading...";

    /* Use the API to send a request to your module.php */
    $scope.getHeader = (function() {
    $api.request({
        module: 'CredentialSearch', //Your module name
        action: 'getHeader'   //Your action defined in module.php
    }, function(response) {
        $scope.title = response.title;
        $scope.version = "Version "+response.version;
      })
    });

    $scope.getHeader();

}]);

registerController('CredentialSearch_ControlsController', ['$api', '$scope', '$rootScope', '$interval', '$timeout', function($api, $scope, $rootScope, $interval, $timeout) {
    /* It is good practice to 'initialize' your variables with nothing */

    /* Use the API to send a request to your module.php */
    $api.request({
        module: 'CredentialSearch', //Your module name
        action: 'getContents'   //Your action defined in module.php
    }, function(response) {
        if (response.success === true) {           //If the response has an index called "success" that returns the boolean "true", then:
            $scope.greeting = response.greeting;   // Set the variable $scope.greeting to the response index "greeting"
            $scope.content = response.content;     // Set the variable $scope.content to the response index "content".
        }
        console.log(response) //Log the response to the console, this is useful for debugging.
    });

		$scope.status = "Loading...";
		$scope.statusLabel = "default";
		$scope.starting = false;

		$scope.install = "Loading...";
		$scope.installLabel = "default";
		$scope.processing = false;

		$scope.device = '';
		$scope.sdAvailable = false;

		$rootScope.status = {
				installed : false,
				refreshOutput : false,
				refreshHistory : false,
				refreshProfiles : false
		};

    $scope.refreshStatus = (function() {
				$api.request({
            module: "CredentialSearch",
            action: "refreshStatus"
        }, function(response) {
            $scope.status = response.status;
				    $scope.statusLabel = response.statusLabel;

			      $rootScope.status.installed = response.installed;
			      $scope.device = response.device;
			      $scope.sdAvailable = response.sdAvailable;
			      if(response.processing) $scope.processing = true;
			      $scope.install = response.install;
			      $scope.installLabel = response.installLabel;
        })
    });

    $scope.toggle = (function() {
			if($scope.status != "Stop")
				$scope.status = "Starting...";
			else
				$scope.status = "Stopping...";

		$scope.statusLabel = "warning";
		$scope.starting = true;

		$rootScope.status.refreshOutput = false;
		$rootScope.status.refreshHistory = false;

		$api.request({
		    module: 'CredentialSearch',
		    action: 'toggle',
		    command: $rootScope.profileData
		}, function(response) {
		    $timeout(function(){
            $rootScope.status.refreshOutput = true;
						$rootScope.status.refreshHistory = true;

						$scope.starting = false;
						$scope.refreshStatus();

		        }, 2000);
            console.log("request: toggle");
            console.log($rootScope.profileData);
            console.log("-----");
		    })
	  });

    $scope.handleDependencies = (function(param) {
      if(!$rootScope.status.installed)
			   $scope.install = "Installing...";
		  else
			   $scope.install = "Removing...";

      $api.request({
          module: 'CredentialSearch',
          action: 'handleDependencies',
					destination: param
      }, function(response){
          if (response.success === true) {
							$scope.installLabel = "warning";
							$scope.processing = true;

              $scope.handleDependenciesInterval = $interval(function(){
              		$api.request({
                  		module: 'CredentialSearch',
                      action: 'handleDependenciesStatus'
                  }, function(response) {
                  		if (response.success === true){
                      		$scope.processing = false;
                          $interval.cancel($scope.handleDependenciesInterval);
                          $scope.refreshStatus();
                      }
                  });
              }, 5000);
          }
        });
    });

	   $scope.refreshStatus();
}]);

registerController('CredentialSearch_EditorController', ['$api', '$scope', '$rootScope', '$timeout', function($api, $scope, $rootScope, $timeout) {
	$scope.profiles = [];
	$scope.selectedProfile = "--";

	$scope.profileData = '';
	$scope.saveProfileLabel = "primary";
	$scope.saveProfile = "New Profile";
	$scope.saving = false;

	$scope.deleteProfileLabel = "danger";
	$scope.deleteProfile = "Delete Profile";
	$scope.deleting = false;

	$scope.profileName = "";

	$scope.getProfiles = (function(param) {
		$api.request({
						module: 'CredentialSearch',
						action: 'getProfiles'
				}, function(response) {
						$scope.profiles = response;
            $rootScope.profileData = $scope.profileData;
            console.log("request: getProfiles");
            console.log($scope.profileData);
            console.log(response);
            console.log("-----");
				});
		});

	$scope.showProfile = (function() {
		$scope.output = "";

		if($scope.selectedProfile != "--") {
			$scope.profileName = $scope.selectedProfile;
			$scope.saveProfile = "Save Profile";

			$api.request({
					module: 'CredentialSearch',
					action: 'showProfile',
					profile: $scope.selectedProfile
				}, function(response) {
							$scope.profileData = response.profileData;
              $rootScope.profileData = $scope.profileData;
              console.log("request: showProfile");
              console.log($scope.profileData);
              console.log(response);
              console.log("-----");
				});
		}
		else {
			$scope.profileName = "";
			$scope.profileData = "";
			$scope.saveProfile = "New Profile";
		}
	});

	$scope.deleteProfileData = (function() {
		$scope.deleteProfileLabel = "warning";
		$scope.deleteProfile = "Deleting...";
		$scope.deleting = true;

		$api.request({
			module: 'CredentialSearch',
			action: 'deleteProfile',
			profile: $scope.selectedProfile
		}, function(response) {
					$scope.deleteProfileLabel = "success";
					$scope.deleteProfile = "Deleted";

					$timeout(function(){
								$scope.deleteProfileLabel = "danger";
								$scope.deleteProfile = "Delete Profile";
								$scope.deleting = false;
					}, 2000);

					$scope.getProfiles();
					$scope.selectedProfile = '--';
					$scope.profileName = "";
					$scope.profileData = "";

					$scope.saveProfile = "New Profile";

					$rootScope.status.refreshProfiles = true;
          $rootScope.profileData = $scope.profileData;
          console.log("request: deleteProfile");
          console.log($scope.profileData);
          console.log(response);
          console.log("-----");
		});
	});

	$scope.saveProfileData = (function() {
		if($scope.selectedProfile != "--" && $scope.profileName != "")
		{
				$scope.saveProfileLabel = "warning";
				$scope.saveProfile = "Saving...";
				$scope.saving = true;

				$api.request({
					module: 'CredentialSearch',
					action: 'saveProfileData',
					profileData: $scope.profileData,
					profile: $scope.selectedProfile
				}, function(response) {
								$scope.saveProfileLabel = "success";
								$scope.saveProfile = "Saved";

								$timeout(function(){
										$scope.saveProfileLabel = "primary";
										$scope.saveProfile = "Save Profile";
										$scope.saving = false;
								}, 2000);
                $rootScope.profileData = $scope.profileData;
                console.log("request: saveProfileData");
                console.log($scope.profileData);
                console.log(response);
                console.log("-----");
				});
			}
			else if($scope.selectedProfile == "--" && $scope.profileName != "")
			{
				$scope.saveProfileLabel = "warning";
				$scope.saveProfile = "Saving...";
				$scope.saving = true;

				$api.request({
					module: 'CredentialSearch',
					action: 'saveProfileData',
					profileData: $scope.profileData,
					profile: $scope.profileName
				}, function(response) {
								$scope.saveProfileLabel = "success";
								$scope.saveProfile = "Saved";

								$timeout(function(){
										$scope.saveProfileLabel = "primary";
										$scope.saveProfile = "Save Profile";
										$scope.saving = false;
								}, 2000);

								$scope.getProfiles();
								$scope.selectedProfile = $scope.profileName;

								$rootScope.status.refreshProfiles = true;
				});
			}
	});

	$scope.getProfiles();
}]);

registerController('CredentialSearch_OutputController', ['$api', '$scope', '$rootScope', '$interval', function($api, $scope, $rootScope, $interval) {
  $scope.output = 'Loading...';
	$scope.filter = '';

	$scope.refreshLabelON = "default";
	$scope.refreshLabelOFF = "danger";

  $scope.refreshOutput = (function() {
		$api.request({
            module: "CredentialSearch",
            action: "refreshOutput",
						filter: $scope.filter
        }, function(response) {
            $scope.output = response;
        })
    });

	$scope.clearFilter = (function() {
				$scope.filter = '';
				$scope.refreshOutput();
	});

  $scope.toggleAutoRefresh = (function() {
    if($scope.autoRefreshInterval)
		{
			$interval.cancel($scope.autoRefreshInterval);
			$scope.autoRefreshInterval = null;
			$scope.refreshLabelON = "default";
			$scope.refreshLabelOFF = "danger";
		}
		else
		{
			$scope.refreshLabelON = "success";
			$scope.refreshLabelOFF = "default";

			$scope.autoRefreshInterval = $interval(function(){
				$scope.refreshOutput();
	        }, 5000);
		}
    });

		$scope.refreshOutput();

		$rootScope.$watch('status.refreshOutput', function(param) {
			if(param) {
				$scope.refreshOutput();
			}
		});

}]);

registerController('CredentialSearch_HistoryController', ['$api', '$scope', '$rootScope', function($api, $scope, $rootScope) {
	$scope.history = [];
	$scope.historyOutput = 'Loading...';
	$scope.historyDate = 'Loading...';

  $scope.refreshHistory = (function() {
      $api.request({
          module: "CredentialSearch",
          action: "refreshHistory"
      }, function(response) {
              $scope.history = response;
      })
  });

  $scope.viewHistory = (function(param) {
	$api.request({
          module: "CredentialSearch",
          action: "viewHistory",
		file: param
      }, function(response) {
          $scope.historyOutput = response.output;
		$scope.historyDate = response.date;
      })
  });

  $scope.deleteHistory = (function(param) {
	$api.request({
          module: "CredentialSearch",
          action: "deleteHistory",
		file: param
      }, function(response) {
          $scope.refreshHistory();
      })
  });

	$scope.downloadHistory = (function(param) {
				$api.request({
						module: 'CredentialSearch',
						action: 'downloadHistory',
						file: param
				}, function(response) {
						if (response.error === undefined) {
								window.location = '/api/?download=' + response.download;
						}
				});
		});

	$scope.refreshHistory();

	$rootScope.$watch('status.refreshHistory', function(param) {
		if(param) {
			$scope.refreshHistory();
		}
	});

}]);
