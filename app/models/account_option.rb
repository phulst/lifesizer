class AccountOption < ActiveRecord::Base
  belongs_to :user
  belongs_to :custom_bookmarklet

  #validates_uniqueness_of :user_id

  PLANS = { 0 => :free, 1 => :micro, 2 => :small, 3 => :standard, 4 => :big, 5 => :huge }
end
