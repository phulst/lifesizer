
set :rails_env, "production"
set :domain, 'linode.lifesizer.com'
set :user, 'lsapp'
set :branch, 'master'

role :web, domain
role :app, domain
role :db,  domain, :primary => true

# need to add the rbenv/shims path, otherwise it can't find rake when running commands with 'sh'
set :default_environment, {
  'PATH' => "/home/lsapp/.rbenv/shims:$PATH",
  'RAILS_STAGE' => default_stage
}
