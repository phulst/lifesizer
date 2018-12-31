class User < ActiveRecord::Base
  has_many :images
  has_many :api_keys
  has_one :account_option

  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable, :lockable, :timeoutable and :activatable
  devise :database_authenticatable, :registerable, :omniauthable,
         :recoverable, :rememberable, :trackable, :validatable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :admin, :plan

  after_create :create_account_options

  # increments the image_ref_count field and returns the new value
  def next_auto_ref
    count = -1
    User.transaction do
      self.lock!
      count = self.image_ref_count + 1
      # for some reason update_attributes doesn't appear to work here
      self.image_ref_count = count
      self.save!
    end
    count
  end

  # returns a display name for the current user
  def display_name
    if !self.first_name.blank?
      self.first_name
    elsif !self.name.blank?
      self.name
    elsif !self.provider_username.blank?
      self.provider_username
    else
      self.email
    end
  end

  def self.from_omniauth(auth)
    just_registered = false
    u = where(auth.slice(:provider, :uid)).first_or_create do |user|
      just_registered = true
      user.provider = auth.provider
      user.uid = auth.uid
      user.image_url = auth.info.image
      user.provider_username = auth.info.nickname
      #user.email = auth.info.email if auth.info.email # this column is set to not null, but "" default
      user.first_name = auth.info.first_name
      user.last_name = auth.info.last_name
      user.name = auth.info.name

      case auth.provider
      when 'twitter'
        user.provider_profile_url = auth.info.urls.Twitter rescue nil
      when 'facebook'
        user.provider_profile_url = auth.info.urls.Facebook rescue nil
      when 'google_oauth2'
        user.provider_profile_url = auth.extra.raw_info.link rescue nil
      end
    end
    return u, just_registered
  end

  def self.new_with_session(params, session)
    if session["devise.user_attributes"]
      new(session["devise.user_attributes"], without_protection: true) do |user|
        user.attributes = params
        user.valid?
      end
    else
      super
    end
  end

  # password is not required when
  def password_required?
    super && provider.blank?
  end

  def email_required?
    super && provider.blank?
  end

  private

  # create account_options association on user create
  def create_account_options
    AccountOption.create!(:user => self)
  end
end