const { emailSchema } = require('../login/model');
const { orderSchema } = require('../trade/model');
const modelRoute = {
  '/login': emailSchema,
  '/balance': emailSchema,
  '/advice': emailSchema,
  '/user-info': emailSchema,
  '/buy': orderSchema,
  '/sell': orderSchema,
  '/position': emailSchema,
  '/price': emailSchema,
};
module.exports.validate = (req, res, next) => {
  req.body = req.method === 'GET' ? req.query : req.body;
  //console.log('Request:', JSON.stringify(req.body));
  const { error } = modelRoute[req.path].validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
    });
  }
  next();
};
