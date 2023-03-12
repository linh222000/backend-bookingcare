import db from '../models/index'
require('dotenv').config();
const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;
import _ from 'lodash';


let getTopDoctorHome = (limitInput) => {
    return new Promise(async(resolve, reject) => {
        try {
            let users = await db.user.findAll({
                limit: limitInput,
                where: { roleId: 'R2' },
                order: [['createAt', 'DESC']],
                attribute: {
                    exclude: ['password']
                },
                // raw: true
                include: [
                    { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] }
                ],
                raw: true,
                nest: true
            })
            resolve({
                errCode: 0,
                data: users
            })
        } catch (e) {
            reject(e);
        }
    })
}

let getAllDoctors = () => {
    return new Promise(async(resolve, reject) => {
        try {
            let doctors = await db.User.findAll({
                where: {roleId: 'R2'},
                attributes: {
                    exclude: ['password', 'image']
                }
            })
            resolve({
                errCode: 0,
                data: doctors
            })
        } catch (e) {
            reject(e)
        }
    })
}

let saveDetailInforDoctors = (inputData) => {
    return ( new Promise(async(resolve, reject) => {
        try {
            if(!inputData.doctorId || !inputData.contentHTML || !inputData.contentMarkdown || !inputData.action 
                || !inputData.selectedPrice || !inputData.selectedPayment || !inputData.selectedProvince 
                || !inputData.nameClinic || !inputData.addressClinic || !inputData.note
            ) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            } else {
                // upsert to Markdown table
                if (inputData.action === 'CREATE') {
                    await db.Markdown.create({
                        contentHTMl: inputData.contentHTML,
                        contentMarkdown: inputData.contentMarkdown,
                        description: inputData.description,
                        soctorId: inputData.doctorId
                    })
                } else if (inputData.action === 'EDIT') {
                    let doctorMarkdow = await db.Markdown.findOne({
                        where: { doctorId: inputData.doctorId },
                        raw: false
                    })
                    if(doctorMarkdow) {
                        doctorMarkdow.contentHTMl = inputData.contentHTML;
                        doctorMarkdow.contentMarkdown = inputData.contentMarkdown;
                        doctorMarkdow.description = inputData.description;
                        doctorMarkdow.updateAt = new Date();
                        await doctorMarkdow.save()
                    }
                             
                }
                // upsert to Doctor_infor table
                let doctorInfor = await db.Doctor_Infor.findOne({
                    where: {
                        doctorId: inputData.doctorId,
                    },
                    raw: false
                })
                if(doctorInfor){
                    // update
                    doctorInfor.doctorId = inputData.doctorId;
                    doctorInfor.priceId = inputData.selectedPrice;
                    doctorInfor.provinceId = inputData.selectedProvince;
                    doctorInfor.paymentId = inputData.selectedPayment;
                    doctorInfor.nameClinic = inputData.nameClinic;
                    doctorInfor.addressClinic = inputData.addressClinic;
                    doctorInfor.note = inputData.note;
                    await doctorInfor.save()
                } else{
                    // create
                    await db.Doctor_Infor.create({
                        doctorId : inputData.doctorId,
                        priceId : inputData.selectedPrice,
                        provinceId : inputData.selectedProvince,
                        paymentId : inputData.selectedPayment,
                        nameClinic : inputData.nameClinic,
                        addressClinic : inputData.addressClinic,
                        note : inputData.note,
                    })
                }
                resolve({
                    errCode: 0,
                    errMessage: 'Save infor doctor successed'
                })
            }
        } catch (e) {
            reject(e)
        }
    }))
}
let getDetailDoctorById = (inputId) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing require parameter'
                })
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: inputId
                    },
                    attribute: {
                    exclude: ['password']
                },
                // raw: true
                include: [
                    { 
                        model: db.Markdown,
                        attributes: ['description', 'contentHTML', 'contentMarkdown'] 
                    },
                    { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { 
                        model: db.Doctor_infor,
                        attributes: {
                            exclude: ['id', 'doctorId']
                        },
                        include: [
                            { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                            { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                            { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                        ]
                        // attributes: ['description', 'contentHTML', 'contentMarkdown'] 
                    },
                ],
                raw: false,
                nest: true
                })
                if (data && data.image) {
                    data.image = new Buffer(data.image, 'base64').toString('binary')
                }
                if (!data) data = {};
                resolve({
                    errCode: 0,
                    data: data
                })
            }
            
        } catch (e) {
            reject(e)
        }
    })
}
let bulkCreateSchedule = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!data.arrSchedule || !data.doctorId || !data.formatedDate) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing require parameter!'
                })
            } else {
                let schedule = data.arrSchedule;
                if(schedule && schedule.length > 0) {
                    schedule = schedule.map(item => {
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                        return item;
                    })
                }
                // get all existing data
                let existing = await db.Schedule.findAll(
                    {
                        where: { doctorId: data.doctorId, date: data.formatedDate },
                        attributes: ['timeType', 'date', 'doctorId', 'maxNumber'],
                        raw: true
                    }
                );
                // convert date
                // if(existing && existing.length > 0) {
                //     existing = existing.map(item => {
                //         item.date = new Date(item.date).getDate();
                //         return item;
                //     })
                // }
                // check trùng data khi chọn(compare different)
                let toCreate = _.differenceBy(schedule, existing, (a, b) =>{
                    // thêm dấu + vào trước biến kiểu string thì sẽ thành số nguyên
                    return a.timeType === b.timeType && +a.date === +b.date;
                })
                // create data
                if (toCreate && toCreate.length > 0){
                    await db.Schedule.bulkCreate(toCreate);
                }
                resolve({
                    errCode: 0,
                    errMessage: 'ok'
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
let getScheduleByDate = (doctorId, date) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing require parameter!'
                })
            } else {
                let dataSchedule = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date
                    },
                    include: [
                        { model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi'] },
                    ],
                    raw: false,
                    nest: true
                })
                if(!dataSchedule) dataSchedule = [];
                resolve({
                    errCode: 0,
                    data: dataSchedule
                })
            }
        } catch (e) {
            reject(e)
        }
    })
}
module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    saveDetailInforDoctors: saveDetailInforDoctors,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleByDate: getScheduleByDate
}
