<?php namespace pineapple;


/* The class name must be the name of your module, without spaces. */
/* It must also extend the "Module" class. This gives your module access to API functions */
class CredentialSearch extends Module
{
    public function route()
    {
        switch ($this->request->action) {
            case 'getContents':    // If you request the action "getContents" from your Javascript, this is where the PHP will see it, and use the correct function
                $this->getContents();  // $this->getContents(); refers to your private function that contains all of the code for your request.
                break;                 // Break here, and add more cases after that for different requests.
            case 'getHeader':
                $this->getHeader();
                break;
            case 'getProfiles':
    						$this->getProfiles();
    						break;
    				case 'showProfile':
    						$this->showProfile();
    						break;
    				case 'deleteProfile':
    						$this->deleteProfile();
    						break;
    				case 'saveProfileData':
    						$this->saveProfileData();
    						break;
            case 'refreshStatus':
                $this->refreshStatus();
                break;
            case 'toggle':
                $this->toggle();
                break;
            case 'handleDependencies':
                $this->handleDependencies();
                break;
            case 'handleDependenciesStatus':
                $this->handleDependenciesStatus();
                break;
            case 'refreshOutput':
                $this->refreshOutput();
                break;
            case 'refreshHistory':
                $this->refreshHistory();
                break;
            case 'viewHistory':
                $this->viewHistory();
                break;
            case 'deleteHistory':
                $this->deleteHistory();
                break;
						case 'downloadHistory':
								$this->downloadHistory();
								break;
        }
    }

    private function getContents()  // This is the function that will be executed when you send the request "getContents".
    {
        $this->response = array("success" => true,    // define $this->response. We can use an array to set multiple responses.
                                "greeting" => "Hey there!",
                                "content" => "This is the HTML template for your new module! The example shows you the basics of using HTML, AngularJS and PHP to seamlessly pass information to and from Javascript and PHP and output it to HTML.");
    }

    private function getHeader()
    {
      $moduleInfo = @json_decode(file_get_contents("/pineapple/modules/CredentialSearch/module.info"));
      $this->response = array('title' => $moduleInfo->title, 'version' => $moduleInfo->version);
    }

    private function getProfiles()
    {
      $this->response = array();
      $profileList = array_reverse(glob("/pineapple/modules/CredentialSearch/profiles/*"));
      array_push($this->response, array("text" => "--", "value" => "--"));
      foreach ($profileList as $profile) {
            $profileData = file_get_contents('/pineapple/modules/CredentialSearch/profiles/'.basename($profile));
            array_push($this->response, array("text" => basename($profile), "value" => $profileData));
      }
    }

    private function showProfile()
    {
        $profileData = file_get_contents('/pineapple/modules/CredentialSearch/profiles/'.$this->request->profile);
        $this->response = array("profileData" => $profileData);
    }

    private function deleteProfile()
    {
        exec("rm -rf /pineapple/modules/CredentialSearch/profiles/".$this->request->profile);
    }

    private function saveProfileData()
    {
      $filename = "/pineapple/modules/CredentialSearch/profiles/".$this->request->profile;
      file_put_contents($filename, $this->request->profileData);
    }

    private function refreshStatus()
    {
      if (!file_exists('/tmp/CredentialSearch.installing'))
      {
        if (!$this->checkDependency("ngrep"))
        {
          $installed = false;
          $install = "Not installed";
          $installLabel = "danger";
          $processing = false;

          $status = "Start";
          $statusLabel = "success";
        }
        else
        {
          $installed = true;
          $install = "Installed";
          $installLabel = "success";
          $processing = false;

          if ($this->checkRunning("ngrep"))
          {
            $status = "Stop";
            $statusLabel = "danger";
          }
          else
          {
            $status = "Start";
            $statusLabel = "success";
          }
        }
      }
      else
      {
        $installed = false;
        $install = "Installing...";
        $installLabel = "warning";
        $processing = true;

        $status = "Start";
        $statusLabel = "success";
      }

      $device = $this->getDevice();
      $sdAvailable = $this->isSDAvailable();

      $this->response = array("device" => $device, "sdAvailable" => $sdAvailable, "status" => $status, "statusLabel" => $statusLabel, "installed" => $installed, "install" => $install, "installLabel" => $installLabel, "processing" => $processing);
    }

    protected function checkDependency($dependencyName)
		{
				return ((exec("which {$dependencyName}") == '' ? false : true) && ($this->uciGet("CredentialSearch.module.installed")));
		}

    protected function getDevice()
    {
        return trim(exec("cat /proc/cpuinfo | grep machine | awk -F: '{print $2}'"));
    }

    private function toggle()
    {
				if(!$this->checkRunning("ngrep"))
				{
          $cmd = $this->request->command;
          if($cmd == "") {
            $cmd = 'user|pass';
          }
          $cmd = preg_replace("/\n|\r/","",$cmd);
          //$cmd = preg_replace("/\|/","\\\|",$cmd);

          $full_cmd = "ngrep -i -d wlan0 -W byline \\\"" . $cmd . "\\\" -O /pineapple/modules/CredentialSearch/log/log_".time().".pcap >> /pineapple/modules/CredentialSearch/log/log_".time().".log";
					shell_exec("echo -e \"{$full_cmd}\" > /tmp/CredentialSearch.run");

					$this->execBackground("/pineapple/modules/CredentialSearch/scripts/ngrep.sh start");
				}
				else
				{
					$this->execBackground("/pineapple/modules/CredentialSearch/scripts/ngrep.sh stop");;
				}
    }

    private function handleDependencies()
    {
        if(!$this->checkDependency("ngrep"))
        {
              $this->execBackground("/pineapple/modules/CredentialSearch/scripts/dependencies.sh install ".$this->request->destination);
              $this->response = array('success' => true);
        }
        else
        {
              $this->execBackground("/pineapple/modules/CredentialSearch/scripts/dependencies.sh remove");
              $this->response = array('success' => true);
        }
    }

    private function handleDependenciesStatus()
    {
        if (!file_exists('/tmp/CredentialSearch.installing'))
        {
          $this->response = array('success' => true);
        }
        else
        {
          $this->response = array('success' => false);
        }
    }

    private function refreshOutput()
  	{
      if ($this->checkDependency("ngrep"))
      {
        if ($this->checkRunning("ngrep"))
        {
          $path = "/pineapple/modules/CredentialSearch/log";

    			$latest_ctime = 0;
          $latest_filename = '';

          $d = dir($path);
          while (false !== ($entry = $d->read())) {
            $filepath = "{$path}/{$entry}";
            if (is_file($filepath) && filectime($filepath) > $latest_ctime) {
              $latest_ctime = filectime($filepath);
  						$latest_filename = $entry;
  					}
          }

          if($latest_filename != "")
          {
            $log_date = gmdate("F d Y H:i:s", filemtime("/pineapple/modules/CredentialSearch/log/".$latest_filename));

            if ($this->request->filter != "")
            {
              $filter = $this->request->filter;
              $cmd = "cat /pineapple/modules/CredentialSearch/log/".$latest_filename." | ".$filter;
            }
            else
            {
              $cmd = "cat /pineapple/modules/CredentialSearch/log/".$latest_filename;
            }

            exec ($cmd, $output);
            if(!empty($output))
              $this->response = implode("\n", $output);
            else
              $this->response = "Empty log...";
          }
        }
        else
        {
          $this->response = "ngrep is not running...";
        }
      }
      else
      {
       $this->response = "ngrep is not installed...";
      }
    }

    private function refreshHistory()
    {
      $this->streamFunction = function () {
        $log_list = array_reverse(glob("/pineapple/modules/CredentialSearch/log/*.log"));

        echo '[';
        for($i=0;$i<count($log_list);$i++)
        {
          $info = explode("_", basename($log_list[$i]));
          $entryDate = gmdate('Y-m-d H-i-s', $info[1]);
          $entryName = basename($log_list[$i]);

          echo json_encode(array($entryDate, $entryName));

          if($i!=count($log_list)-1) echo ',';
        }
        echo ']';
      };
    }

    private function viewHistory()
    {
      $log_date = gmdate("F d Y H:i:s", filemtime("/pineapple/modules/CredentialSearch/log/".$this->request->file));
      exec ("cat /pineapple/modules/CredentialSearch/log/".$this->request->file, $output);

      if(!empty($output))
        $this->response = array("output" => implode("\n", $output), "date" => $log_date);
      else
        $this->response = array("output" => "Empty log...", "date" => $log_date);
    }

    private function deleteHistory()
    {
      $file = basename($this->request->file,".log");
  		exec("rm -rf /pineapple/modules/CredentialSearch/log/".$file.".*");
    }

    private function downloadHistory()
    {
      $this->response = array("download" => $this->downloadFile("/pineapple/modules/CredentialSearch/log/".$this->request->file));
    }

    protected function checkRunning($processName)
    {
        $processName = escapeshellarg($processName);
        return exec("ps | grep -w {$processName} | grep -v ' grep'") !== '';
    }
}
