require 'spec_helper'

describe "custom_bookmarklets/index.html.erb" do
  before(:each) do
    cb1 = CustomBookmarklet.create(:name => 'Name', :script => 'MyText')
    cb2 = CustomBookmarklet.create(:name => 'Name', :script => 'MyText')
    assign(:custom_bookmarklets, [cb1, cb2])
  end

  it "renders a list of custom_bookmarklets" do
    render
    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "tr>td", :text => "Name".to_s, :count => 2
  end
end
