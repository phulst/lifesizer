require 'open-uri'

class CloudCache

  def initialize(opts = {})
    @opts = opts
    @config = YAML::load(File.open("#{Rails.root}/config/cloudfiles.yml"))
  end

  # use this method to perform an action within a given container. Wraps your code with a
  # connection and closes again afterwards. For example:
  #   do_in_container('mycache') do |container}
  #     puts container.count
  #   end
  def do_in_container(container_name, &block)
    if !Settings.cloud_files.enabled
      Rails.logger.warn('cloud files disabled, not saving anything')
      return
    end

    username = @opts[:username] || Settings.cloud_files.username
    api_key  = @opts[:api_key]  || Settings.cloud_files.api_key

    begin
      @cf ||= CloudFiles::Connection.new(:username => username, :api_key => api_key)
      container = @cf.container(container_name)
      yield container
    rescue Exception => err
      Rails.logger.error("Cloudfiles connection failed when attempting to use container #{container_name}: #{err}")
      Rails.logger.error(caller.join("\n"))
      puts caller.join("\n")
    end
  end

  # saves the files and urls used in embed scripts (defined in config/cloudfiles.yml)
  def save_embed_files()
    save_files_from_config(Settings.cloud_files.containers.embed.name, @config['embed_files'])
  end

  # saves a user's image cache to CloudFiles. Takes a user api (read) key
  # @param user_key user's API key
  # @param purge set to true if cache should be purged
  def save_user_cache(user_key, purge = false)
    url = "http://#{Settings.webhost}/images/check_img?key=#{user_key}&callback=imageRefCache.notify"
    target = "lsc/#{user_key}.js"

    Rails.logger.info("caching url '#{url}' to CloudFiles with target: #{target}")
    do_in_container(Settings.cloud_files.containers.lscache.name) do |c|
      #object_purge(c, target)
      save_url(c, url, target, false)
    end
  end

  # saves all the files for the lifesizer viewer
  def save_viewer_files(only_new = false)
    save_files_from_config(Settings.cloud_files.containers.assets.name, @config['viewer_files'], only_new)
  end

  # saves all the files for the lifesizer web site (shared between WP/Rails sites)
  def save_web_files(only_new = false)
    save_files_from_config(Settings.cloud_files.containers.assets.name, @config['web_files'], only_new)
  end

  def save_bookmarklet_files(only_new = false)
    save_files_from_config(Settings.cloud_files.containers.assets.name, @config['bookmarklet_files'], only_new)
  end

  def save_custom_bookmarklet(user_key, script_content)
    target = "bmc/#{user_key}.js"
    Rails.logger.info("caching custom bookmarklet to CloudFiles with target: #{target}")
    do_in_container(Settings.cloud_files.containers.lscache.name) do |c|
      #object_purge(c, target)
      obj = save_object(c, script_content, target, false)
    end
  end

  # sets TTL on a container (in minutes)
  def set_TTL_on_container(c, minutes = 60)
    c.make_public({:ttl => minutes * 60})
  end

  # purges an object from the CDN
  def object_purge(container, name)
    obj = container.object(name)
    if (obj)
      Rails.logger.info("purging #{name} from container #{container.name}")
      begin
        obj.purge_from_cdn('email@lifesizer.com')
      rescue Exception => err
        Rails.logger.info("unable to purge #{name} from container #{container.name}: #{err}")
      end
    else
      Rails.logger.info("object #{name} doesn't exist yet in container #{container.name}, no need to purge")
    end
  end

  private

  def save_files_from_config(container, config, only_new = false)
    do_in_container(container) do |c|
      host = "http://#{Settings.webhost}"

      config.each do |f|
        if f['url']
          url = "#{host}#{f['url']}"
          Rails.logger.info "going to store url #{url} to CloudFiles"
          save_url(c, url, f['target'], false) # urls always get updated
        elsif f['file']
          filename = "#{Rails.root}/public#{f['file']}"
          # for files, target defaults to same path as input
          target = f['target'] || f['file']
          msg = "going to store file #{filename} to CloudFiles"
          Rails.logger.info msg
          puts msg

          save_file(c, filename, target, only_new)
        elsif f['dir']
          # save all files in a directory
          root = "#{Rails.root}/public"
          ptn = "#{root}#{f['dir']}/**/*"
          Dir.glob(ptn).each do |file|
            if File.file?(file)
              target = file.split(root)[1]
              msg = "going to store file #{target} (matched with pattern '#{f['dir']}') to CloudFiles"
              Rails.logger.info msg
              puts msg
              save_file(c, file, target, only_new)
            end
          end
        end
      end
    end
  end

  # loads a url, and saves that to the cloud container with given name and optional headers
  # if only_new == true, skip past any already existing files (so assume they haven't changed)
  def save_url(container, url, name, only_new, headers = {})
    io = open(url).read
    save_object(container, io, name, only_new, headers)
  end

  # saves a local file to the cloudfiles cache
  def save_file(container, filename, name, only_new, headers = {})
    file = File.new(filename)
    save_object(container, file, name, only_new, headers)
  end

  # saves an object (file or stream) to the CloudFiles container
  def save_object(container, object, name, only_new, headers = {})
    name.slice!(0) if name[0,1] == '/' # names cannot start with '/'
    # set appropriate content type
    if !headers['Content-Type']
      ct = nil
      if name =~ /.jpg$/i
        ct = 'image/jpeg'
      elsif name =~ /.png$/i
        ct = 'image/png'
      elsif name =~ /.js$/i
        ct = 'text/javascript'
      elsif name =~ /.gif$/i
        ct = 'image/gif'
      elsif name =~ /.css$/i
        ct = 'text/css'
      elsif name =~ /.html$/i
        ct = 'text/html'
      end
      headers['Content-Type'] = ct if ct
    end

    obj = nil
    if !container.object_exists?(name)
      # object doesn't exist yet
      obj = container.create_object name, true
    elsif !only_new
      # object exists
      obj = container.object(name)
    else
      msg = "skipping #{name}, already exists"
      Rails.logger.info msg
      puts msg
    end

    if (obj)
      if obj.write(object, headers)
        msg = "saved #{name} to CloudFiles, url: #{obj.public_url}"
        Rails.logger.info msg
        #puts msg
        return obj
      else
        msg = "unable to write #{name} to CloudFiles"
        Rails.logger.error msg
        #puts msg
      end
    end
    false
  end
end
