CarrierWave.configure do |config|
  config.fog_credentials = {
    :provider           => 'Rackspace',
    :rackspace_username => Settings.cloud_files.username,
    :rackspace_api_key  => Settings.cloud_files.api_key,
    # there is currently a Rackspace IPv6 routing issue, so force to IPv4
    # https://community.rackspace.com/developers/f/7/p/1799/5300
    :connection_options => { :family => ::Socket::Constants::AF_INET }
  }

  if Settings.cloud_files.enabled
    config.fog_directory = Settings.cloud_files.containers.images.name
    config.asset_host = "http://#{Settings.cloud_files.containers.images.host}"
  end
end
