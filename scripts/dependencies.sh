#!/bin/sh
#2015 - Whistle Master

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/sd/lib:/sd/usr/lib
export PATH=$PATH:/sd/usr/bin:/sd/usr/sbin

[[ -f /tmp/CredentialSearch.installing ]] && {
  exit 0
}

touch /tmp/CredentialSearch.installing

if [ "$1" = "install" ]; then
  if [ "$2" = "internal" ]; then
	   opkg update
     opkg install ngrep
  elif [ "$2" = "sd" ]; then
    opkg update
    opkg install ngrep --dest sd
  fi

  touch /etc/config/CredentialSearch
  echo "config CredentialSearch 'module'" > /etc/config/CredentialSearch

  uci set CredentialSearch.module.installed=1
  uci commit CredentialSearch.module.installed

elif [ "$1" = "remove" ]; then
    #opkg remove ngrep
    #Dont remove ngrep. Because ngrep can not re-install
    rm -rf /etc/config/CredentialSearch
fi

rm /tmp/CredentialSearch.installing
