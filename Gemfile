source 'http://rubygems.org'

gem 'rails', '3.2.22.2'
gem 'rake'

# authentication plugin
gem 'devise', '~> 2.2'

# Use unicorn as the web server
# gem 'unicorn'

# Deploy with Capistrano
gem 'capistrano'

# gem for sending mail
gem 'tlsmail'

# background jobs
gem 'delayed_job', '~> 3.0.2'
gem 'delayed_job_active_record', '~> 0.3.2'
gem 'daemons', '1.1.8'

gem 'pg', '0.13.2'
gem 'haml'
gem 'rmagick', '2.13.2'

gem 'jquery-rails'
gem 'ezcrypto', '0.7.2'
gem 'will_paginate'

gem 'rspec', '~> 2.10'
gem 'guid'
gem 'cloudfiles'

gem 'carrierwave'
gem 'fog'

gem 'rack-mobile-detect', :git => 'https://github.com/phulst/rack-mobile-detect'
gem 'mobile-fu', :git => 'https://github.com/benlangfeld/mobile-fu'
gem 'dynamic_form'
gem "rails_config"

gem 'httparty', '0.8.1'
gem 'backbone-on-rails'
gem 'rails_admin'

gem 'airbrake'

# omniauth
gem 'omniauth-twitter'
gem 'omniauth-facebook'
gem 'omniauth-google-oauth2'

group :development, :test do
  gem 'thin'
  gem 'capistrano-ext'
  gem "rspec-rails"
  gem "rspec-rails-mocha"
  gem "autotest"
  gem "factory_girl_rails"

  gem 'cucumber-rails', :require => false
  gem 'capybara'
  gem 'capybara-screenshot'
  gem 'database_cleaner'
  gem 'simplecov'
  #gem 'ruby-debug'
  gem "better_errors"
end

group :test do
  gem 'webmock' # this cannot be in the dev profile or regular http fetch won't work anymore
end

group :production do
  gem 'therubyracer'
#  gem 'postgres'
end

group :assets do
  gem 'sass-rails', '~> 3.2.3'
  gem 'coffee-rails'
  gem 'uglifier'

  gem 'compass-rails'
  gem 'zurb-foundation', :git => 'https://github.com/zurb/foundation'
end

# Bundle the extra gems:
# gem 'bj'
# gem 'nokogiri', '1.4.1'
# gem 'sqlite3-ruby', :require => 'sqlite3'
# gem 'aws-s3', :require => 'aws/s3'

# Bundle gems for certain environments:
# gem 'rspec', :group => :test
# group :test do
#   gem 'webrat'
# end
