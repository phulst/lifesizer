class ApiController < ApplicationController

  def new
    @api_key = ApiKey.new
  end

  def create
  end

end
