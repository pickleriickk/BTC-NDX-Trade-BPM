const Joi = require('joi');

const emailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
    'string.empty': 'Email cannot be empty',
  }),
  password: Joi.string().required().messages({
    'string.password': 'Please provide a valid password',
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  }),
});

module.exports = {
  emailSchema,
};
