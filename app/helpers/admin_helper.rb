module AdminHelper
  include LayoutHelper

  def users
    User.order("created_at")
  end

  def api_read_key_for_user(user)
    k = ApiKey.find_read_key(user)
    k ? k.key : nil
  end

  def api_write_key_for_user(user)
    k = ApiKey.find_write_key(user)
    k ? k.key : nil
  end

  def api_hostname_for_user(user)
    k = ApiKey.find_read_key(user)
    k ? k.hostname : nil
  end

  def local_lifesizer_cache(read_key)
    "http://#{Settings.webhost}/images/check_img?key=#{read_key}&callback=imageRefCache.notify"
  end

  def cloud_lifesizer_cache(read_key)
    "http://#{cdn_cache_host}/lsc/#{read_key}.js"
  end

  def local_bookmarklet(key)
    "http://#{Settings.webhost}/bmc/#{key}.js"
  end

  def cloud_bookmarklet(key)
    "http://#{cdn_cache_host}/bmc/#{key}.js"
  end

  def select_bookmarklet_tag(bookmarklets, custom_bookmarklet)
    default = Struct.new :name, :id
    generic = default.new('-- generic --', nil)
    bookmarklets.unshift(generic)
    select_tag("custom_bookmarklet", options_from_collection_for_select(bookmarklets, "id", "name",
            (custom_bookmarklet ? custom_bookmarklet.id : nil) ))
  end
end
