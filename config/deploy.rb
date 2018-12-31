require 'capistrano/ext/multistage'
require "delayed/recipes"

# stage config, see https://boxpanel.bluebox.net/public/the_vault/index.php/Capistrano_Multi_Stage_Instructions
set :stages, %w(production staging linode)
set :default_stage, 'staging'

# be sure to change these
set :application, 'lifesizer'

# file paths
set :repository,  "enter_repo_url_here"
set :deploy_to, "/var/app/lifesizer"

# you might need to set this if you aren't seeing password prompts
default_run_options[:pty] = true
ssh_options[:forward_agent] = true


# miscellaneous options
set :deploy_via, :remote_cache
set :scm, 'git'
set :scm_verbose, true
set :use_sudo, false

# clean up old releases after deployment
set :keep_releases, 5  # this is the default, keep 5 releases
after "deploy:restart", "deploy:cleanup"


after "deploy:update_code", "deploy:web:update_maintenance_page"
disable_path = "#{shared_path}/system/maintenance/"
namespace :deploy do
  desc "cause Passenger to initiate a restart"
  task :restart do
    run "touch #{current_path}/tmp/restart.txt"
  end

  task :start do
  end

  desc "reload the database with seed data"
  task :seed do
    run "cd #{current_path}; rake db:seed RAILS_ENV=production"
  end

  namespace :web do
    desc "Disables the website by putting the maintenance files live."
    task :disable, :roles => :web do
      on_rollback { run "mv #{disable_path}index.html #{disable_path}index.disabled.html" }
      run "mv #{disable_path}index.disabled.html #{disable_path}index.html"
    end

    desc "Enables the website by disabling the maintenance files."
    task :enable, :roles => :web do
      run "mv #{disable_path}index.html #{disable_path}index.disabled.html"
    end

    desc "Copies your maintenance from public/maintenance to shared/system/maintenance."
    task :update_maintenance_page, :roles => :web do
      run "rm -rf #{shared_path}/system/maintenance/; true"
      run "cp -r #{release_path}/public/maintenance #{shared_path}/system/"
    end
  end
end

after "deploy:update_code", :bundle_install
desc "install the necessary prerequisites"
task :bundle_install, :roles => :app do
  run "cd #{release_path} && bundle install"
end

after "deploy:create_symlink", :image_link
desc "creates the symlink for thumbnail and tmp images"
task :image_link, :roles => :app do
  run "ln -s #{shared_path}/content #{current_path}/public/content"
end

namespace :rails do
  desc "Remote console"
  task :console, :roles => :app do
    server = find_servers(:roles => [:app]).first
    puts "running console on #{server.host}"
    run_with_tty server, "bundle exec rails console #{rails_env}"
  end

  desc "Remote dbconsole"
  task :dbconsole, :roles => :app do
    server = find_servers(:roles => [:app]).first
    run_with_tty server, "bundle exec rails dbconsole #{rails_env}"
  end

  def run_with_tty(server, cmd)
    # looks like total pizdets
    command = []
    command += %W( ssh -t #{gateway} -l #{self[:gateway_user] || self[:user]} ) if     self[:gateway]
    command += %W( ssh -t )
    command += %W( -p #{server.port}) if server.port
    command += %W( -l #{user} #{server.host} )
    command += %W( cd #{current_path} )
    # have to escape this once if running via double ssh
    command += [self[:gateway] ? '\&\&' : '&&']
    command += Array(cmd)
    system *command
  end
end

# delayed job
before "deploy:restart", "delayed_job:stop"
after  "deploy:restart", "delayed_job:start"
after "deploy:stop",  "delayed_job:stop"
after "deploy:start", "delayed_job:start"

task :uname do
  run "uname -a"
end

# added by airbrake
require './config/boot'
require 'airbrake/capistrano'
