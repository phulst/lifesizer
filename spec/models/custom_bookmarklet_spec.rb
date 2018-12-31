require 'spec_helper'

describe CustomBookmarklet do

  before(:each) do
    @bm = CustomBookmarklet.new( :name => 'myname', :script => 'myscriptcode')
  end

  it "should succesfully save and reload custom bookmarklet" do
    @bm.should be_a_new(CustomBookmarklet)
    @bm.save!
    CustomBookmarklet.should have(1).record

    bm = CustomBookmarklet.find_by_name(@bm.name)
    bm.name.should == @bm.name
    bm.script.should == @bm.script
  end
end
