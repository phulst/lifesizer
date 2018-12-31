
set :rails_env, "production"
set :domain, 'beta.lifesizer.com'
set :user, 'lsapp'
set :branch, 'master'

role :web, domain
role :app, domain
role :db,  domain, :primary => true

# As Capistrano executes in a non-interactive mode and therefore doesn't cause
# any of your shell profile scripts to be run, the following might be needed
# if (for example) you have locally installed gems or applications.  Note:
# this needs to contain the full values for the variables set, not simply
# the deltas.
default_environment['PATH']='/usr/local/bin:/usr/bin:/bin'
default_environment['GEM_PATH']='/usr/local/lib/ruby/gems/1.9.1'

