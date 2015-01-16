#!/usr/bin/ruby

require 'rubygems'
require 'bundler/setup'
Bundler.require

require 'json'

class ZerotrackConnection < EM::WebSocket::Connection
  def trigger_on_open(handshake)
    @group = handshake.path.gsub(/\W+/, '\1')
    @redis = EM::Hiredis.connect
    @pubsub = @redis.pubsub

    @pubsub.subscribe @group

    @pubsub.on :message do |group, data|
      send data
    end
  end

  def trigger_on_message(data)
    @redis.publish @group, data
  end

  def trigger_on_close(event = {})
    @pubsub.unsubscribe @group
  end
end

EM.run do
  EM.start_server('0.0.0.0', 9393, ZerotrackConnection, :debug => false)
end
