require 'spec_helper'

describe "custom_bookmarklets/show.html.erb" do
  before(:each) do
    cb = CustomBookmarklet.new
    cb.stubs(:name => 'Name', :script => 'MyText', :id => 1)
    @custom_bookmarklet = assign(:custom_bookmarklet, cb)
  end

  pending "renders attributes in <p>" do
    render
    # Run the generator again with the --webrat flag if you want to use webrat matchers
    rendered.should match(/Name/)
    # Run the generator again with the --webrat flag if you want to use webrat matchers
    rendered.should match(/MyText/)
  end
end
