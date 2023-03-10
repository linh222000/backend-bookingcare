import db from '../models/index'

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
            if(!inputData.doctorId || !inputData.contentHTML || !inputData.contentMarkdown || !inputData.action) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            } else {
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
module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    saveDetailInforDoctors: saveDetailInforDoctors,
    getDetailDoctorById: getDetailDoctorById
}
