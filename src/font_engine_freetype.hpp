/*****************************************************************************
 *
 * This file is part of Mapnik (c++ mapping toolkit)
 *
 * Copyright (C) 2011 Artem Pavlenko
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 *****************************************************************************/

#pragma once

#include "glyph_info.hpp"
#include "font_set.hpp"
#include "guarded_map.hpp"

// stl
#include <map>
#include <memory>
#include <thread>
#include <vector>

// freetype2
extern "C"
{
#include <ft2build.h>
#include FT_FREETYPE_H
// #include FT_STROKER_H
#include FT_MODULE_H
}

struct FT_LibraryRec_;
struct FT_MemoryRec_;

namespace fontserver {

typedef guarded_map<uint32_t, glyph_info> glyph_cache_type;
typedef std::shared_ptr<glyph_cache_type> glyph_cache_ptr;

class font_face;
typedef std::shared_ptr<font_face> face_ptr;

class font_face_set;
typedef std::shared_ptr<font_face_set> face_set_ptr;

class freetype_engine {
public:
    freetype_engine();
    virtual ~freetype_engine();

    static bool is_font_file(std::string const& file_name);
    /*! \brief register a font file
     *  @param file_name path to a font file.
     *  @return bool - true if at least one face was successfully registered in the file.
     */
    static bool register_font(std::string const& file_name);
    /*! \brief register a font file
     *  @param dir - path to a directory containing fonts or subdirectories.
     *  @param recurse - default false, whether to search for fonts in sub directories.
     *  @return bool - true if at least one face was successfully registered.
     */
    static bool register_fonts(std::string const& dir, bool recurse = false);
    static std::vector<std::string> face_names();
    static std::map<std::string, std::pair<int, std::string>> const& get_mapping();
    face_ptr create_face(std::string const& family_name);
private:
    FT_LibraryRec_ *library_;
    std::unique_ptr<FT_MemoryRec_> memory_;

    static std::mutex mutex_;
    static std::map<std::string, std::pair<int, std::string>> name2file_;
    static std::map<std::string, std::string> memory_fonts_;
    static std::map<const std::string, glyph_cache_ptr> glyph_cache_map_;
};

template <typename T>
class face_manager {
    typedef T font_engine_type;
    typedef std::map<std::string, face_ptr> face_ptr_cache_type;

public:
    face_manager(T &engine)
        : engine_(engine),
          face_ptr_cache_() {}

    face_ptr get_face(std::string const& name);
    face_set_ptr get_face_set();
    face_set_ptr get_face_set(std::string const& name);
    face_set_ptr get_face_set(font_set const& fset);

private:
    font_engine_type &engine_;
    face_ptr_cache_type face_ptr_cache_;
};

typedef face_manager<freetype_engine> face_manager_freetype;

}