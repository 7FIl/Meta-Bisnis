'use client';

import { useState } from 'react';

// Sample employee data
const SAMPLE_EMPLOYEES = [
  { id: 1, name: 'Budi Santoso' },
  { id: 2, name: 'Siti Rahma' },
  { id: 3, name: 'Ahmad Hidayat' },
  { id: 4, name: 'Dewi Lestari' },
  { id: 5, name: 'Roni Wijaya' },
  { id: 6, name: 'Citra Kusuma' },
  { id: 7, name: 'Eka Pratama' },
  { id: 8, name: 'Farah Dzahra' },
  { id: 9, name: 'Gunawan Putra' },
  { id: 10, name: 'Hana Maulida' },
];

export default function EmployeeAbsence({ absences, onAddAbsence }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('sakit');
  const [totalEmployees, setTotalEmployees] = useState(SAMPLE_EMPLOYEES.length);
  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !date) return;

    const absence = {
      id: Date.now(),
      name,
      date,
      reason,
      timestamp: new Date().toLocaleString('id-ID'),
    };

    onAddAbsence(absence);
    setName('');
    setDate('');
    setReason('sakit');
  };

  const handleCloseEdit = () => {
    setIsEditMode(false);
    setName('');
    setDate('');
    setReason('sakit');
  };

  const today = new Date().toLocaleDateString('id-ID');
  const todayAbsences = absences.filter((a) => a.date === today);

  // Derived counts
  const absentCount = todayAbsences.length;
  const presentToday = totalEmployees - absentCount;
  const absentToday = absentCount;

  // Get employee attendance status
  const getEmployeeStatus = (employeeName) => {
    const absence = todayAbsences.find((a) => a.name.toLowerCase() === employeeName.toLowerCase());
    return absence ? absence.reason : 'hadir';
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-users-check text-blue-500"></i> Kehadiran Karyawan
          </h3>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-600 font-semibold uppercase">Hadir</p>
              <h2 className="text-3xl font-bold text-green-600 mt-2">{presentToday}</h2>
              <p className="text-xs text-slate-500 mt-1">Karyawan</p>
            </div>
            <div className="text-center border-l border-slate-300">
              <p className="text-xs text-slate-600 font-semibold uppercase">Absen</p>
              <h2 className="text-3xl font-bold text-red-600 mt-2">{absentToday}</h2>
              <p className="text-xs text-slate-500 mt-1">dari {totalEmployees}</p>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => setIsEditMode(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <i className="fas fa-edit"></i> Atur Kehadiran
        </button>

        {/* Employee List */}
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-2">
            <i className="fas fa-list text-blue-500"></i> Daftar Karyawan Hari Ini
          </h4>
          <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
            <div className="max-h-60 overflow-y-auto scrollbar-hide pr-4">
              {SAMPLE_EMPLOYEES.map((employee, index) => {
                const status = getEmployeeStatus(employee.name);
                const isPresent = status === 'hadir';
                const isLast = index === SAMPLE_EMPLOYEES.length - 1;

                return (
                  <div
                    key={employee.id}
                    className={`flex items-center justify-between p-3 transition-all ${
                      isPresent ? 'bg-green-50' : 'bg-white'
                    } ${!isLast ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          isPresent ? 'bg-green-500' : 'bg-slate-300'
                        }`}
                      ></div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isPresent ? 'text-green-700' : 'text-slate-700'
                          }`}
                        >
                          {employee.name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ml-2 font-semibold ${
                        isPresent
                          ? 'bg-green-200 text-green-700'
                          : status === 'sakit'
                          ? 'bg-red-200 text-red-700'
                          : status === 'izin'
                          ? 'bg-yellow-200 text-yellow-700'
                          : status === 'cuti'
                          ? 'bg-purple-200 text-purple-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isPresent ? 'HADIR' : status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-clipboard-check text-blue-500"></i> Atur Kehadiran Karyawan
              </h2>
              <button
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Karyawan
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Cth: Budi, Siti, Ahmad"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status Kehadiran
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sakit">Sakit</option>
                  <option value="izin">Izin</option>
                  <option value="cuti">Cuti</option>
                  <option value="alfa">Alfa</option>
                </select>
              </div>

              {/* Absences List in Modal */}
              {todayAbsences.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Absen Hari Ini</p>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {todayAbsences.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-700 text-sm">{a.name}</p>
                          <p className="text-xs text-slate-500">
                            {a.reason.charAt(0).toUpperCase() + a.reason.slice(1)}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 font-medium ${
                            a.reason === 'sakit'
                              ? 'bg-red-100 text-red-700'
                              : a.reason === 'izin'
                              ? 'bg-yellow-100 text-yellow-700'
                              : a.reason === 'cuti'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {a.reason.toUpperCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <i className="fas fa-save mr-1"></i> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
