# This model can be included to provide non model/controller classes with access to the Rails logger
module WithRailsLogger
  def logger
    Rails.logger
  end
end