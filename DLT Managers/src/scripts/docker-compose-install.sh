#!/bin/sh
set -e

sudo curl -L "https://github.com/docker/compose/releases/download/$(curl -L "https://api.github.com/repos/docker/compose/releases/latest" | grep --perl-regexp --only-matching '"tag_name": "\K.*?(?=")')/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
