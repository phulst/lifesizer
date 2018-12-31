# These helper methods can be called in your template to set variables to be used in the layout
# This module should be included in all views globally,
# to do so you may need to add this line to your ApplicationController
# helper :layout
module LayoutHelper
  def title(page_title, show_title = true)
    content_for(:title) { h(page_title.to_s) }
    @show_title = show_title
  end

  def show_title?
    @show_title
  end

  # helper for adding stylesheets from non-layout files
  def stylesheet(*args)
    content_for(:head) { stylesheet_link_tag(*args) }
  end

  # helper for adding javascript files from non-layout files
  def javascript(*args)
    content_for(:head) { javascript_include_tag(*args) }
  end

  # returns true if currently running in production environment
  def prod_env?
    Rails.env.production?
  end

  # returns true if currently running in staging environment
  def staging_env?
    Rails.env.staging?
  end

  def prod_or_staging?
    prod_env? || staging_env?
  end

  def google_jquery
    "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"
  end

  def google_jquery_ui
    "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.17/jquery-ui.min.js"
  end

  def cms_host
    "http://#{Settings.external_urls.cms}"
  end

  def cms_url(rel_url)
    "#{cms_host}#{rel_url}"
  end


  def link_to_cms(name, rel_url, opts = {})
    link_to(raw(name), cms_url(rel_url), opts)
  end

  def support_link
    link_to "support", 'mailto:support@lifesizer.com'
  end

    # return something like '&host=localhost:3000' to add to javascript urls in local environments.
  # this is used for the embeddable widget
  def include_test_host_par
    prod_env? ? '' : raw("&host=#{current_host}")
  end

  def include_file_type_par(image)
    image.file_type == 'jpg' ? '' : raw("&type=#{image.file_type}")
  end

  # return parameter with image host name, but only for non-production environments
  def include_img_host_par
    return '' if prod_env?
    host = Settings.cloud_files.enabled ? Settings.cloud_files.containers.images.host : current_host;
    raw("&imgHost=#{host}")
  end

  def bookmarklet_url
    prod_or_staging? ? "http://#{cdn_assets_host}/js/bm/ls-bm-1.0.js" : "http://#{current_host}/assets/bookmarklet.js"
  end

  def assets_host
    prod_or_staging? ? cdn_assets_host : current_host
  end

  def embed_script_url(use_ssl)
    url = nil
    if prod_or_staging?
      url = use_ssl ? "https://#{cdn_ssl_embed_host}/ls.js" : "http://#{cdn_embed_host}/ls.js"
    else
      url = use_ssl ? "https://" : "http://"
      url += "#{current_host}/assets/embed.js"
    end
    url
  end

  def cache_host
    prod_or_staging? ? cdn_cache_host : current_host
  end

  # todo: refactor out all hosts below. Use settings instead.
  def cdn_assets_host
    Settings.cloud_files.containers.assets.host
  end

  def cdn_embed_host
    Settings.cloud_files.containers.embed.host
  end

  def cdn_ssl_embed_host
    # use the CDN hostname
    Settings.cloud_files.containers.embed.cdn_host
  end

  def cdn_cache_host
    Settings.cloud_files.containers.lscache.host
  end
end