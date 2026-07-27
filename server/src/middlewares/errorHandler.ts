import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err.message === 'User already exists') {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === 'Invalid credentials') {
    return res.status(401).json({ message: err.message });
  }

  if (err.message === 'User not found') {
    return res.status(404).json({ message: err.message });
  }

  if (err.message === 'Account not found') {
    return res.status(404).json({ message: err.message });
  }

  if (err.message === 'Account name is required') {
    return res.status(400).json({ message: err.message });
  }

  if (
    err.message === 'Transfer not found' ||
    err.message === 'Goal not found' ||
    err.message === 'Source account not found' ||
    err.message === 'Destination account not found'
  ) {
    return res.status(404).json({ message: err.message });
  }

  if (
    err.message === 'Cannot transfer to the same account' ||
    err.message === 'Amount must be positive' ||
    err.message === 'Insufficient funds' ||
    err.message === 'Insufficient goal funds' ||
    err.message === 'targetAmount must be positive'
  ) {
    return res.status(400).json({ message: err.message });
  }

  if (
    err.message === 'Transaction not found' ||
    err.message === 'Category not found'
  ) {
    return res.status(404).json({ message: err.message });
  }

  if (
    err.message === 'accountId and categoryId are required' ||
    err.message === 'type must be income or expense' ||
    err.message === 'Rating must be between 1 and 5' ||
    err.message === 'Category name is required' ||
    err.message === 'Cannot edit a default category' ||
    err.message === 'Cannot delete a default category' ||
    err.message === 'Cannot delete a category that has transactions'
  ) {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: 'Internal server error' });
};
