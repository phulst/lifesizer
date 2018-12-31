require 'spec_helper'

describe ImagesController do

  describe "remote save" do
    before(:each) do
      @read_key = create :api_key_read
      @write_key = create :api_key_write
      @image_url = 'http://www.letsgodigital.org/images/artikelen/38/panasonic-dmc-lx5.jpg'
      stub_http_request(:get, @image_url).to_return(
          :body => File.open(File.join(Rails.root, 'test', 'data', 'images', 'lx5.jpg')), :status => 200)
      @new_url = 'http://host.com/scissors.jpg'
      stub_http_request(:get, @new_url).to_return(
        :body => File.open(File.join(Rails.root, 'test', 'data', 'images', 'scissors.jpg')), :status => 200)

      @img = create :lx5_image, :user => @write_key.user
    end

    context "valid" do
      context "new image" do
        it "without lifesize data" do
          get "remote_save", :key => @write_key.key, :ref => 'camera', :name => 'this is a camera', :image_url => @image_url, :input_length => ''

          assigns(:update).should be false
          img = assigns(:image)
          img.original_url.should == @image_url
          img.ref.should == 'camera'
          img.name.should == 'this is a camera'
          img.input_length.should be_nil
          img.ppi.should be_nil

          data = ActiveSupport::JSON.decode(response.body)
          data['url'].should == @image_url
          data['ref'].should == 'camera'
          data['ppi'].should be_nil
        end

        it "with ppi" do
          get "remote_save", :key => @write_key.key, :ref => 'camera', :name => 'this is a camera', :image_url => @image_url, :ppi => 120

          assigns(:update).should be false
          img = assigns(:image)
          img.original_url.should == @image_url
          img.ref.should == 'camera'
          img.ppi.should == 120
          img.input_length.should be_nil

          data = ActiveSupport::JSON.decode(response.body)
          data['url'].should == @image_url
          data['ref'].should == 'camera'
          data['ppi'].should == 120
        end

        it "with arrow measurements" do
          get "remote_save", {:key => @write_key.key, :ref => 'camera', :name => 'this is a camera', :image_url => @image_url,
              :unit => 'mm', :input_length => '25.4', :arrow_length => '200', :arrow_start => '400,400', :arrow_end => '100,100', :render_width => '500' }

          assigns(:update).should be false
          img = assigns(:image)
          img.original_url.should == @image_url
          img.ref.should == 'camera'
          img.ppi.should == 212.0
          img.input_length.should == 25.4
        end

        it "should default to inches if no unit set" do
          get "remote_save", {:key => @write_key.key, :ref => 'camera', :name => 'this is a camera', :image_url => @image_url, :input_length => '1.5',
                              :arrow_length => '200', :render_width => '500'}

          assigns(:update).should be false
          img = assigns(:image)
          img.input_length.should == 1.5
          img.unit.should == 'in'
        end

        it "should return ref even if not passed in" do
          get "remote_save", :key => @write_key.key, :name => 'this is something new', :image_url => @new_url, :ppi => 120

          data = ActiveSupport::JSON.decode(response.body)
          data['url'].should == @new_url
          data['ref'].should match(/^_(\d)+/)
          data['ppi'].should == 120
          assigns(:update).should be false
        end

        it "should not match on url if ref doesn't match" do
          get "remote_save", :key => @write_key.key, :ref => 'lx6', :name => 'this is a camera', :image_url => @image_url, :ppi => '120'
          assigns(:update).should be false
        end

        it "should save the page_url" do
          page_url = 'http://some.page.url.com'
          get "remote_save", :key => @write_key.key, :ref => 'lx6', :name => 'this is a camera', :image_url => @image_url, :ppi => '120',
              :page_url => page_url
          data = ActiveSupport::JSON.decode(response.body)
          data['page_url'].should == page_url
        end
      end

      context "should save an updated image" do
        # update image if a matching ref is found
        it "identified by ref" do
          get "remote_save", :key => @write_key.key, :ref => 'lx5', :image_url => @new_url, :ppi => '120'
          assigns(:update).should be true
          img = assigns(:image)
          img.name.should == 'panasonic lx5' #name wasn't set so still should have old value
          img.ppi.should == 120.0
          img.ref.should == 'lx5'
          img.original_url.should == @new_url
          img.calibrate_coords.should be_nil
          # width and height should have been updated
          img.width.should == 1907
          img.height.should == 1577
        end

        it "identified by url" do
          get "remote_save", :key => @write_key.key, :name => 'now scissors', :image_url => @image_url
          assigns(:update).should be true
          img = assigns(:image)
          img.ref.should == 'lx5'
          img.name.should == 'now scissors' #name wasn't set so still should have old value
          img.ppi.should == 100.0 # maintains original value
        end

        it "and store new calibration data" do
          ar = @img.auto_ref
          get "remote_save", {:key => @write_key.key, :ref => 'lx5', :name => 'this is a camera', :image_url => @image_url,
              :unit => 'mm', :input_length => '25.4', :arrow_length => '200', :arrow_start => '400,400', :arrow_end => '100,100', :render_width => '500' }

          assigns(:update).should be true
          img = assigns(:image)
          img.calibrate_length.should == 25.4
          img.calibrate_unit.should == Image::UNIT_MM
          img.calibrate_coords.should == "400,400-100,100"
          #verify that auto_ref hasn't changed
          img.auto_ref.should == ar
          img.ppi.should == 212.0
        end

        it "should update the page_url" do
          page_url = "http://my.page.url.com/"
          get "remote_save", :key => @write_key.key, :name => 'now scissors', :image_url => @image_url, :page_url => "#{page_url}1"
          data = ActiveSupport::JSON.decode(response.body)
          data['page_url'].should == "#{page_url}1"
          # now save again, the page_url should get updated
          get "remote_save", :key => @write_key.key, :name => 'now scissors', :image_url => @image_url, :page_url => "#{page_url}2"
          data = ActiveSupport::JSON.decode(response.body)
          data['page_url'].should == "#{page_url}2"
        end
      end
    end

    context "failures" do
      it "should return authentication error if no key is passed in" do
        get 'remote_save'
        response.response_code.should == 200
        resp = ActiveSupport::JSON.decode(response.body)
        resp['error']['msg'].should == "authentication error"
        resp['error']['status'].should == 401
      end

      it "should return authentication error if invalid key is passed in" do
        get 'remote_save', :key => '1234'
        resp = ActiveSupport::JSON.decode(response.body)
        resp['error']['msg'].should == "authentication error"
        resp['error']['status'].should == 401
      end

      it "should return authentication error if key with only read access is passed in" do
        get 'remote_save', :key => @read_key.key
        ActiveSupport::JSON.decode(response.body)['error']['status'].should == 401
      end

      it "should return an error if the image could not be saved" do
        # mock Image.save! to return error
        Image.any_instance.stubs('save!').raises(ActiveRecord::ActiveRecordError)
        get "remote_save", :key => @write_key.key, :name => 'now scissors', :image_url => @image_url
        # should return an error response with status 500
        ActiveSupport::JSON.decode(response.body)['error']['status'].should == 500
      end

      it "should return error if invalid input_length specified" do
        get "remote_save", :key => @write_key.key, :ref => 'lx5', :image_url => @new_url, :ppi => '120', :input_length => 'invalid'
        ActiveSupport::JSON.decode(response.body)['error']['status'].should == 400
      end

      it "should return error if no image url specified" do
        get "remote_save", :key => @write_key.key, :ref => 'lx5', :ppi => '120'
        ActiveSupport::JSON.decode(response.body)['error']['status'].should == 400
      end
    end
  end


  describe "get" do
    before(:each) do
      @write_key = create :api_key_write
      @img = create :lx5_image, :user => @write_key.user
      @img2 = create :lx5_image, :user => @write_key.user, :ref => 'another'
    end

    it "should return authentication error without a valid key" do
      get 'remote_get', :key => '1234'
      resp = ActiveSupport::JSON.decode(response.body)
      resp['error']['msg'].should == "authentication error"
      resp['error']['status'].should == 401
    end

    it "should return a single image metadata" do
      get 'remote_get', :ref => @img.ref, :key => @write_key.key, :cal => 't'
      resp = ActiveSupport::JSON.decode(response.body)
      resp.should_not be_nil
      resp.should_not be false
      img = stub(resp[0]) # this will turn the hash into a real objects so we don't need bracket notation for properties
      img.original_url.should == "http://www.letsgodigital.org/images/artikelen/38/panasonic-dmc-lx5.jpg"
      img.ref.should == 'lx5'
      img.width.should == 530
      img.height.should == 434
      img.ppi.should == 100.0
      img.name.should == @img.name
      img.page_url.should == @img.page_url
      img.description.should be_nil
      img.unit.should == 'in'
      img.arrow_start.should == '38,266'
      img.arrow_end.should == '489,265'
      img.input_length.should == 4.3
    end

    it "should return multiple images" do
      get 'remote_get', :ref => [@img.ref,@img2.ref], :key => @write_key.key, :cal => 'true'
      resp = ActiveSupport::JSON.decode(response.body)
      resp.length.should == 2
      resp[0]['ref'].should == 'lx5'
      resp[1]['ref'].should == 'another'
    end

    it "should by default not return calibration data" do
      get 'remote_get', :ref => @img.ref, :key => @write_key.key
      resp = ActiveSupport::JSON.decode(response.body)
      resp.should_not be_nil
      resp.should_not be false
      r = resp[0]
      r['unit'].should be_nil
      r['arrow_start'].should be_nil
      r['arrow_end'].should be_nil
      r['input_length'].should be_nil
    end

    it "should respond with 400 if ref not specified" do
      get 'remote_get', :key => @write_key.key
      # create matcher for this
      resp = ActiveSupport::JSON.decode(response.body)
      resp.should_not be_nil
      resp['error']['msg'].should == "bad request"
      resp['error']['status'].should == 400
    end
  end

  describe "check_img" do
    before :each do
      @read_key = create :api_key_read
      @user = @read_key.user
      @img = create :lx5_image, :user => @user
      @img2 = create :lx5_image, :user => @user, :ref => 'another'
      @img3 = create :lx5_image, :user => @user, :ref => 'third'
    end

    context "negative tests" do
      it "should return authentication error without a valid key" do
        get 'check_img', :key => '1234'
        resp = ActiveSupport::JSON.decode(response.body)
        resp['error']['msg'].should == "authentication error"
        resp['error']['status'].should == 401
      end
    end

    it "should return all image refs for valid users" do
      get 'check_img', :key => @read_key.key
      resp = ActiveSupport::JSON.decode(response.body)
      refs = resp['refs']
      refs.should be_a Array
      refs.length.should == 3
    end
  end

  context "destroy" do
    before :each do
      @user1 = create :user
      @user2 = create :user
      @img1 = create :lx5_image,  :ref => 'img1', :user => @user1
      @img2 = create :lx5_image,  :ref => 'img1', :user => @user2
    end

    it "user should be able to delete own image" do
      sign_in @img1.user
      lambda {
        delete :destroy, :id => @img1.guid
      }.should change{Image.count}.by(-1)
    end


    pending "user should not be able to delete anyone else's image" do
      sign_in @img1.user
      lambda {
        delete :destroy, :id => @img2.guid
        response.response_code.should == 404
      }.should_not change{Image.count}
    end
  end

  describe "other functions" do
    it { @controller.positive_numeric?('blah').should == false }
    it { @controller.positive_numeric?('-2').should == false }
    it { @controller.positive_numeric?('-0.12').should == false }
    it { @controller.positive_numeric?('0.2').should == true }
    it { @controller.positive_numeric?('155').should == true }
    it { @controller.positive_numeric?('15f').should == false }
    it { @controller.positive_numeric?('0001,2').should == false }
  end
end