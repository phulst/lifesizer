require File.join(File.dirname(__FILE__), "/../spec_helper" )

describe UnknownImageHandler do
  before :each do
    @handler = UnknownImageHandler.new
  end

  context "without valid request" do

    it "should return nil with incorrect app key" do
      app_key = 'wrong'
      user_id = '509'
      ref = '12345'

      img = @handler.attempt_create_image(user_id, app_key, ref)
      img.should be_nil
    end

    it "should return nil without app key" do
      user_id = '509'
      ref = '12345'

      img = @handler.attempt_create_image(user_id, nil, ref)
      img.should be_nil
    end

    it "should return nil without unknown user_id" do
      app_key = UnknownImageHandler::EeBeads::APP_KEY
      user_id = '508'
      ref = '12345'

      img = @handler.attempt_create_image(user_id, nil, ref)
      img.should be_nil
    end
  end

  context "for eebeads" do
    before :each do
      @eebeads_user = FactoryGirl.create(:user, :id => UnknownImageHandler::EeBeads::USER_ID )
    end

    it "should create a new image" do
      url = "http://www.eebeads.com/Pix/22346L.jpg"
      stub_http_request(:get, url).to_return(
        :body => File.new('test/data/images/22346L.jpg'), :status => 200)

      app_key = UnknownImageHandler::EeBeads::APP_KEY
      user_id = UnknownImageHandler::EeBeads::USER_ID
      ref = '22346'

      img = @handler.attempt_create_image(user_id, app_key, ref)
      img.should_not be_nil
      img.original_url.should == url
      img.ref.should == ref
      img.width.should == 233
      img.height.should == 250
      img.auto_ref.should_not be_nil
      img.upload.should_not be_nil
      img.medium_width.should == 233
      img.medium_height.should == 250
    end
  end

end