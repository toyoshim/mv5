require 'sinatra'

get '/' do
    '<!DOCTYPE html><html><body style="margin: 0; cursor: none;"><script src="promise.js"></script><script src="tmalib/tma.js"></script><script src="main.js"></script></body></html>'
end
