Lifesizer::Application.configure do
  # Settings specified here will take precedence over those in config/environment.rb

  # The production environment is meant for finished, "live" apps.
  # Code is not reloaded between requests
  config.cache_classes = true

  # Full error reports are disabled and caching is turned on
  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true

  # Specifies the header that your server uses for sending files
  config.action_dispatch.x_sendfile_header = "X-Sendfile"

  # For nginx:
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect'

  # If you have no front-end server that supports something like X-Sendfile,
  # just comment this out and Rails will serve the files

  # See everything in the log (default is :info)
  # config.log_level = :debug

  # Use a different logger for distributed setups
  # config.logger = SyslogLogger.new

  # Use a different cache store in production
  # config.cache_store = :mem_cache_store

  # Disable Rails's static asset server
  # In production, Apache or nginx will already do this
  config.serve_static_assets = false

  # Enable serving of images, stylesheets, and javascripts from an asset server
  # config.action_controller.asset_host = "http://assets.example.com"

  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.perform_deliveries = true #default value

  # required by devise
  config.action_mailer.default_url_options = { :host => 'staging.lifesizer.com' }

  # Enable threaded mode
  # config.threadsafe!

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation can not be found)
  config.i18n.fallbacks = true

  WORK_DIR = File.expand_path('../../..', __FILE__)
  ROOT_PATH = "/var/app/lifesizer/shared"

  THUMBNAIL_PATH = ROOT_PATH
  THUMBNAIL_BASE = "/content/thumbnails"

  TMP_IMAGE_PATH = ROOT_PATH
  TMP_IMAGE_BASE = "/content/tmp"

  TMP_DIR = "/tmp"

  #
  # assets pipeline config
  #
  config.assets.enabled = true

  # Compress JavaScripts and CSS
  config.assets.compress = true

  # Choose the compressors to use
  # config.assets.js_compressor  = :uglifier
  # config.assets.css_compressor = :yui

  # Don't fallback to assets pipeline if a precompiled asset is missed
  config.assets.compile = false

  # Generate digests for assets URLs.
  config.assets.digest = true

  # Defaults to Rails.root.join("public/assets")
  # config.assets.manifest = YOUR_PATH

  # Precompile additional assets (application.js, application.css, and all non-JS/CSS are already added)
  config.assets.precompile += %w{
      bookmarklet.js demo_image.js embed.js images_configure.js images_edit.js images_gallery.js view.js
      images/new.js
      admin/admin_images_require.js
      google/google_search_require.js
      test/screen_test_require.js
      ext/raphael-min.js ext/html5shiv.js
      reveal/classList.js reveal/showdown.js reveal/markdown.js reveal/highlight.js reveal/zoom.js reveal/notes.js reveal/earring_demo.js
      view/mobile_require.js
      registrations/new.js

      bookmarklet.css common.css common_minimal.css images_configure.css images_edit.css view.css widget_popup.css
      embed/instructions.css
      account/bookmarklet.css
      common/ie.css
      images/gallery.css images/new.css
      admin/images.css
      google/google_search_require.css
      demo/image.css
      view/mobile_view.css
  }
end
