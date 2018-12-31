class CustomBookmarklet < ActiveRecord::Base
  has_many :account_options
  has_many :users, :through => :account_options
end
