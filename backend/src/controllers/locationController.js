const { Location } = require('../models');

// @desc    Lấy danh sách tất cả địa điểm
// @route   GET /api/locations
// @access  Public
const getAllLocations = async (req, res, next) => {
  try {
    const locations = await Location.findAll({
      order: [['TenTinh', 'ASC'], ['TenDiaDiem', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết một địa điểm
// @route   GET /api/locations/:id
// @access  Public
const getLocationById = async (req, res, next) => {
  try {
    const location = await Location.findByPk(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm'
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo địa điểm mới
// @route   POST /api/locations
// @access  Private/Admin
const createLocation = async (req, res, next) => {
  try {
    const { TenDiaDiem, TenTinh } = req.body;

    // Kiểm tra trùng lặp
    const existing = await Location.findOne({ where: { TenDiaDiem } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Địa điểm đã tồn tại'
      });
    }

    const location = await Location.create({
      TenDiaDiem,
      TenTinh
    });

    res.status(201).json({
      success: true,
      message: 'Tạo địa điểm thành công',
      data: location
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật địa điểm
// @route   PUT /api/locations/:id
// @access  Private/Admin
const updateLocation = async (req, res, next) => {
  try {
    const location = await Location.findByPk(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm'
      });
    }

    const { TenDiaDiem, TenTinh } = req.body;

    await location.update({
      TenDiaDiem: TenDiaDiem || location.TenDiaDiem,
      TenTinh: TenTinh || location.TenTinh
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật địa điểm thành công',
      data: location
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa địa điểm
// @route   DELETE /api/locations/:id
// @access  Private/Admin
const deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findByPk(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm'
      });
    }

    await location.destroy();

    res.status(200).json({
      success: true,
      message: 'Xóa địa điểm thành công'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
};