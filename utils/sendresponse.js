const sendResponse = (status, res, data = null, message = '') => {
  if (status === 'fail') {
    return res.status(400).json({
      status: 'fail',
      message: message || 'Request failed!',
    });
  }
  return res.status(200).json({
    status: 'success',
    message: message || 'Request successful!',
    results: data ? data.length : 0,
    data,
  });
};

export default sendResponse;
